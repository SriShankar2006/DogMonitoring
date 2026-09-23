export async function loginAdmin(req, res) {
  const submittedPassword = String(req.body?.password || '').trim();
  const expectedPassword = String(process.env.ADMIN_PASSWORD || '').trim();

  if (!expectedPassword) {
    return res.status(500).json({
      success: false,
      message: 'Admin password is not configured on the server.'
    });
  }

  if (submittedPassword !== expectedPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid password.'
    });
  }

  return res.json({
    success: true,
    message: 'Admin access granted.'
  });
}
