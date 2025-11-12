import Cookies from "js-cookie";

export function getTokenNoRedirect(): string | null {
  const token = Cookies.get("token"); //Saca el token de las cookies
  return token || null; //Lo devuelve
}
