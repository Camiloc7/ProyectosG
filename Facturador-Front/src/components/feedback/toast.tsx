import { errorSound, toastSound } from './audio';

export const showTemporaryToast = (
  title = 'Nueva factura creada',
  // duration = 3000
  duration = 2500
) => {
  toastSound.play();

  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.top = '80px';
  toast.style.right = '20px';
  toast.style.backgroundColor = '#F6FFF9';
  toast.style.color = '#333';
  toast.style.padding = '16px 20px';
  toast.style.borderRadius = '12px';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
  toast.style.fontSize = '16px';
  toast.style.fontWeight = 'normal';
  toast.style.opacity = '1';
  toast.style.transition = 'opacity 0.3s ease-in-out';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '12px';
  toast.style.zIndex = '1000';
  toast.style.border = '1px solid #48C1B5';

  // Icono de check
  const icon = document.createElement('div');
  icon.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  `;

  icon.style.width = '24px';
  icon.style.height = '24px';
  icon.style.background = 'linear-gradient(180deg, #48CA93 0%, #48BACA 100%)'; // ✅ degradado aplicado
  icon.style.display = 'flex';
  icon.style.alignItems = 'center';
  icon.style.justifyContent = 'center';
  icon.style.borderRadius = '8px';
  // icon.style.fontSize = '18px'; // (ya no necesario, pero puedes dejarlo si agregas texto)

  // Contenedor de texto
  const textContainer = document.createElement('div');
  const titleElement = document.createElement('div');
  titleElement.textContent = title;
  titleElement.style.fontWeight = 'bold';
  titleElement.style.fontSize = '16px';
  const messageElement = document.createElement('div');
  messageElement.style.fontSize = '14px';
  messageElement.style.color = '#555';

  textContainer.appendChild(titleElement);
  textContainer.appendChild(messageElement);

  // Botón de cerrar
  const closeButton = document.createElement('div');
  closeButton.innerHTML = '&times;';
  closeButton.style.cursor = 'pointer';
  closeButton.style.marginLeft = 'auto';
  closeButton.style.marginTop = '2px';
  closeButton.style.fontSize = '25px';
  closeButton.style.color = '#777';
  closeButton.onclick = () => toast.remove();

  toast.appendChild(icon);
  toast.appendChild(textContainer);
  toast.appendChild(closeButton);

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

export const showErrorToast = (title = 'Ocurrió un error', duration = 4000) => {
  errorSound.play();

  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.top = '80px';
  toast.style.right = '20px';
  toast.style.backgroundColor = '#FFF5F5'; // fondo de error
  toast.style.color = '#27303A';
  toast.style.padding = '16px 20px';
  toast.style.borderRadius = '12px';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
  toast.style.fontSize = '16px';
  toast.style.fontWeight = 'normal';
  toast.style.opacity = '1';
  toast.style.transition = 'opacity 0.3s ease-in-out';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '12px';
  toast.style.zIndex = '1000';
  toast.style.border = '1px solid #F4B0A1';

  // Icono de error (X en círculo rojo)
  const icon = document.createElement('div');
  icon.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `;
  icon.style.width = '24px';
  icon.style.height = '24px';
  icon.style.background = 'linear-gradient(180deg, #E88B76 0%, #CA5048 100%)';
  icon.style.display = 'flex';
  icon.style.alignItems = 'center';
  icon.style.justifyContent = 'center';
  icon.style.borderRadius = '8px';

  // Contenedor de texto
  const textContainer = document.createElement('div');
  const titleElement = document.createElement('div');
  titleElement.textContent = title;
  titleElement.style.fontWeight = 'bold';
  titleElement.style.fontSize = '16px';

  const messageElement = document.createElement('div');
  messageElement.style.fontSize = '14px';
  messageElement.style.color = '#a94442'; // detalle de texto

  textContainer.appendChild(titleElement);
  textContainer.appendChild(messageElement);

  // Botón de cerrar (posicionado igual que en el toast de éxito)
  const closeButton = document.createElement('div');
  closeButton.innerHTML = '&times;';
  closeButton.style.cursor = 'pointer';
  closeButton.style.marginLeft = 'auto';
  closeButton.style.marginTop = '2px';
  closeButton.style.fontSize = '25px';
  closeButton.style.color = '#777';
  closeButton.onclick = () => toast.remove();

  toast.appendChild(icon);
  toast.appendChild(textContainer);
  toast.appendChild(closeButton);

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};
