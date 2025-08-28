// Função simples para verificar token sem dependência externa
export function verifyToken(token: string) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString())
    
    // Verificar se o token expirou
    if (payload.exp && payload.exp < Date.now()) {
      throw new Error("Token expirado")
    }
    
    return payload
  } catch (error) {
    throw new Error("Token inválido")
  }
}

export function getTokenFromRequest(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.substring(7)
}
