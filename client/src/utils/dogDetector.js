import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import { loadLiteRt, loadAndCompile, Tensor as LiteRtTensor } from '@litertjs/core';

const MODEL_URL = '/models/model.tflite';
const LITERT_WASM_PATH = '/litert/';

// YOLOv8 Classification models use standard 224x224 input sizes
const INPUT_SIZE = 224; 

// Strict Production Gate: Require 80% certainty to block false-positive cats
const DOG_CONFIDENCE_THRESHOLD = 0.80;

let litertReadyPromise = null;
let modelPromise = null;

function getLiteRt() {
  if (!litertReadyPromise) {
    litertReadyPromise = loadLiteRt(LITERT_WASM_PATH);
  }
  return litertReadyPromise;
}

function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      await getLiteRt();
      try {
        await tf.setBackend('webgl');
      } catch {
        await tf.setBackend('cpu');
      }
      await tf.ready();
      return loadAndCompile(MODEL_URL, { accelerator: 'wasm' });
    })();
  }
  return modelPromise;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read this image file.'));
    img.src = URL.createObjectURL(file);
  });
}

function createSquareCrop(image, verticalPosition) {
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const maxTop = image.naturalHeight - side;
  const top = maxTop * verticalPosition;
  const left = (image.naturalWidth - side) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  canvas.getContext('2d').drawImage(
    image,
    left,
    top,
    side,
    side,
    0,
    0,
    side,
    side
  );
  return canvas;
}

async function runInference(model, source) {
  let inputTensor;
  let outputs = null;

  try {
    let inputData;
    tf.tidy(() => {
      const pixels = tf.browser.fromPixels(source);
      const resized = tf.image.resizeBilinear(pixels, [INPUT_SIZE, INPUT_SIZE]);
      const normalized = tf.div(resized, 255.0);
      const chw = tf.transpose(normalized, [2, 0, 1]);
      inputData = chw.dataSync();
    });

    inputTensor = new LiteRtTensor(inputData, [1, 3, INPUT_SIZE, INPUT_SIZE]);
    outputs = await model.run(inputTensor);
    const probabilities = await outputs[0].data();
    return probabilities[0];
  } finally {
    inputTensor?.delete();
    if (outputs) {
      outputs.forEach((tensor) => tensor.delete());
      outputs.delete?.();
    }
  }
}

/**
 * Runs the bundled YOLOv8-cls LiteRT model against an image file
 * entirely in the browser to validate if it contains a dog.
 */
export async function detectDogInImage(file) {
  const model = await getModel();
  const imageEl = await loadImage(file);
  try {
    const sources = [
      imageEl,
      createSquareCrop(imageEl, 0.35),
      createSquareCrop(imageEl, 0.75)
    ];
    const confidences = [];
    for (const source of sources) {
      confidences.push(await runInference(model, source));
    }

    const dogConfidence = Math.max(...confidences);
    const notDogConfidence = 1 - dogConfidence;
    console.log(`Gate Metrics -> Dog: ${(dogConfidence * 100).toFixed(1)}% | Not-Dog: ${(notDogConfidence * 100).toFixed(1)}%`);

    return {
      isDog: dogConfidence >= DOG_CONFIDENCE_THRESHOLD,
      confidence: Math.round(dogConfidence * 1000) / 10 
    };
  } catch (error) {
    console.error("❌ Inference Pipeline Failure:", error);
    throw error;
  } finally {
    URL.revokeObjectURL(imageEl.src);
  }
}