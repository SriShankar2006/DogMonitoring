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

/**
 * Runs the bundled YOLOv8-cls LiteRT model against an image file
 * entirely in the browser to validate if it contains a dog.
 */
export async function detectDogInImage(file) {
  const model = await getModel();
  const imageEl = await loadImage(file);

  let inputData;
  tf.tidy(() => {
    const pixels = tf.browser.fromPixels(imageEl); 
    const resized = tf.image.resizeBilinear(pixels, [INPUT_SIZE, INPUT_SIZE]); 
    const normalized = tf.div(resized, 255.0);
    // NCHW formatting for standard YOLO execution paths
    const chw = tf.transpose(normalized, [2, 0, 1]); 
    inputData = chw.dataSync(); 
  });

  const inputTensor = new LiteRtTensor(inputData, [1, 3, INPUT_SIZE, INPUT_SIZE]);
  let outputs = null;
  
  try {
    outputs = await model.run(inputTensor);
    
    // The classification tensor returns a simple Float32Array of raw probabilities
    const probabilities = await outputs[0].data();

    // Map targets matching your exact training set folder sequence
    // Index 0 = 'dog', Index 1 = 'not_dog'
    const dogConfidence = probabilities[0];
    const notDogConfidence = probabilities[1];

    console.log(`📊 Gate Metrics -> Dog: ${(dogConfidence * 100).toFixed(1)}% | Not-Dog: ${(notDogConfidence * 100).toFixed(1)}%`);

    return {
      isDog: dogConfidence >= DOG_CONFIDENCE_THRESHOLD,
      confidence: Math.round(dogConfidence * 1000) / 10 
    };
  } catch (error) {
    console.error("❌ Inference Pipeline Failure:", error);
    throw error;
  } finally {
    // Crucial: Manual clean up to protect WebAssembly memory blocks
    inputTensor.delete();
    if (outputs) {
      outputs.forEach((t) => t.delete());
      outputs.delete?.(); // Handle newer array container drops
    }
    URL.revokeObjectURL(imageEl.src);
  }
}