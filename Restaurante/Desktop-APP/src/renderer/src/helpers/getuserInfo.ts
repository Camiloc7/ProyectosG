export const getUserInfo = async () => {
  const user = await window.electron.storeGet('user')
  return user
}
