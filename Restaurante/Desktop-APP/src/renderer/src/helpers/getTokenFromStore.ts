export async function getTokenFromStore(): Promise<string> {
  const token = await window.electron.storeGet('token')

  if (!token) {
    console.error('NO HAY TOKEN!')
    window.location.href = '/'
  }

  return token
}
