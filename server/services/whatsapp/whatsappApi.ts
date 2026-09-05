/**
 * Centralized Meta WhatsApp Cloud API Service
 * Handles outbound messages, Graph API communications, and connection testing.
 * Academia de Aduanas
 */

export const META_GRAPH_API_VERSION = 'v21.0';
export const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  metaResponse?: any;
  error?: string;
  errorCode?: number;
  errorSubcode?: number;
  errorType?: string;
  isMockFallback?: boolean;
  isSandboxFallback?: boolean;
  sandboxNotice?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  status: 'connected' | 'warning' | 'not_configured' | 'error';
  message: string;
  phoneNumberIdMasked?: string;
  businessAccountIdMasked?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
  codeVerificationStatus?: string;
  platformType?: string;
  isTokenExpired?: boolean;
  isNotVerified?: boolean;
  appSecretStatus?: 'valid' | 'mismatched' | 'not_set';
  appDetails?: { id?: string; name?: string };
  details?: any;
}

/**
 * Utility to mask sensitive IDs for safe frontend display
 * e.g. "103948291039481" -> "1039****9481"
 */
export function maskIdentifier(val?: string): string {
  if (!val) return 'No configurado';
  if (val.length <= 8) return '••••••••';
  return `${val.slice(0, 4)}••••${val.slice(-4)}`;
}

/**
 * Gets currently configured Meta credentials from environment
 */
export function getMetaConfig() {
  return {
    accessToken: process.env.META_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    verifyToken: process.env.WEBHOOK_VERIFY_TOKEN || '',
    appSecret: process.env.META_APP_SECRET || ''
  };
}

/**
 * Tests live connection to Meta WhatsApp Cloud API using configured credentials
 */
export async function testMetaConnection(): Promise<ConnectionTestResult> {
  const { accessToken, phoneNumberId, businessAccountId } = getMetaConfig();

  if (!accessToken || !phoneNumberId) {
    return {
      success: false,
      status: 'not_configured',
      message: 'Faltan credenciales: META_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID no están configurados en los secretos del sistema.',
      phoneNumberIdMasked: maskIdentifier(phoneNumberId),
      businessAccountIdMasked: maskIdentifier(businessAccountId)
    };
  }

  try {
    const url = `${META_GRAPH_BASE_URL}/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,platform_type,status,throughput`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      const errCode = data?.error?.code;
      const errSubcode = data?.error?.error_subcode;
      const errType = data?.error?.type;
      const errorMsg = data?.error?.message || 'Error de autenticación con Meta Graph API';
      console.warn('[Meta Connection Test Status]:', errCode, errorMsg);

      let userMsg = `Error al conectar con Meta (${errCode || response.status}): ${errorMsg}`;
      let isTokenExpired = false;

      if (errCode === 190 || errSubcode === 463) {
        isTokenExpired = true;
        userMsg = `El Token de Acceso de Meta ha expirado (Código 190, subcódigo 463). Es necesario generar un Token Permanente (System User Token) en Meta Business Manager y actualizar el secreto META_ACCESS_TOKEN.`;
      }

      return {
        success: false,
        status: 'error',
        message: userMsg,
        phoneNumberIdMasked: maskIdentifier(phoneNumberId),
        businessAccountIdMasked: maskIdentifier(businessAccountId),
        isTokenExpired,
        details: {
          code: errCode,
          subcode: errSubcode,
          type: errType,
          fbtrace_id: data?.error?.fbtrace_id
        }
      };
    }

    const codeVerif = data.code_verification_status;
    const isNotVerified = codeVerif === 'NOT_VERIFIED';

    // Verify if META_APP_SECRET matches the app to ensure webhooks HMAC signature works
    let appSecretStatus: 'valid' | 'mismatched' | 'not_set' = 'not_set';
    let appDetails: { id?: string; name?: string } | undefined;
    const appSecret = process.env.META_APP_SECRET;

    try {
      const appRes = await fetch(`${META_GRAPH_BASE_URL}/app?fields=id,name`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const appData = await appRes.json();
      if (appData?.id) {
        appDetails = { id: appData.id, name: appData.name };
        if (appSecret) {
          const secretRes = await fetch(
            `https://graph.facebook.com/oauth/access_token?client_id=${appData.id}&client_secret=${appSecret}&grant_type=client_credentials`
          );
          const secretData = await secretRes.json();
          appSecretStatus = secretData.access_token ? 'valid' : 'mismatched';
        }
      }
    } catch {
      // Non-blocking
    }

    if (isNotVerified) {
      return {
        success: true,
        status: 'warning',
        message: `Conectado a Meta con el número ${data.display_phone_number || '+504 8756-3605'}, pero el número está 'NOT_VERIFIED' (Pendiente de verificación SMS). Para poder enviar mensajes a destinatarios externos, debes verificar el número en Meta WhatsApp Manager.`,
        phoneNumberIdMasked: maskIdentifier(phoneNumberId),
        businessAccountIdMasked: maskIdentifier(businessAccountId),
        displayPhoneNumber: data.display_phone_number || 'Registrado',
        verifiedName: data.verified_name || 'Academia de Aduanas',
        qualityRating: data.quality_rating || 'UNKNOWN',
        codeVerificationStatus: codeVerif,
        platformType: data.platform_type,
        isNotVerified: true,
        appSecretStatus,
        appDetails,
        details: data
      };
    }

    return {
      success: true,
      status: 'connected',
      message: 'Conexión exitosa y verificada con Meta WhatsApp Cloud API',
      phoneNumberIdMasked: maskIdentifier(phoneNumberId),
      businessAccountIdMasked: maskIdentifier(businessAccountId),
      displayPhoneNumber: data.display_phone_number || 'Registrado',
      verifiedName: data.verified_name || 'Academia de Aduanas',
      qualityRating: data.quality_rating || 'GREEN',
      codeVerificationStatus: codeVerif,
      platformType: data.platform_type,
      isNotVerified: false,
      appSecretStatus,
      appDetails,
      details: data
    };
  } catch (err: any) {
    console.error('[Meta Connection Test Exception]:', err);
    return {
      success: false,
      status: 'error',
      message: `Fallo de red al conectar con Meta: ${err.message}`,
      phoneNumberIdMasked: maskIdentifier(phoneNumberId),
      businessAccountIdMasked: maskIdentifier(businessAccountId)
    };
  }
}

/**
 * Formats user-friendly actionable error messages in Spanish from Meta Graph API error payloads
 */
export function formatMetaError(data: any, phoneNumberId: string, recipient: string): string {
  const errCode = data?.error?.code;
  const errSubcode = data?.error?.error_subcode;
  const errMessage = data?.error?.message || 'Error desconocido de Meta';

  if (errCode === 190 || errSubcode === 463) {
    return `Token de Meta Expirado (#190): La sesión de acceso a Meta expiró. Se requiere generar un Token Permanente (System User) en Meta Business Manager y actualizar el secreto META_ACCESS_TOKEN.`;
  }
  if (errCode === 133010) {
    return `Número no registrado en Meta (#133010): El número emisor (+504 8756-3605) está en estado NOT_VERIFIED en Meta Cloud API. Debes completar la verificación por SMS en Meta WhatsApp Manager.`;
  }
  if (errCode === 131030) {
    return `Destinatario no autorizado (#131030): El número ${recipient} no está en la lista de prueba de Meta Developer Console (Sandbox). Agrega el número en la consola de Meta o pasa la aplicación a modo 'En Vivo'.`;
  }
  if (errCode === 131047) {
    return `Ventana de 24 horas cerrada (#131047): Han pasado más de 24h desde la última interacción del contacto. Meta exige enviar una plantilla aprobada (HSM) para reabrir la conversación.`;
  }
  if (errCode === 132000 || errCode === 132001) {
    return `Plantilla no registrada en Meta (#${errCode}): La plantilla solicitada no existe o no ha sido aprobada aún en tu cuenta de Meta Business Manager. Debes crearla en business.facebook.com > WhatsApp > Plantillas de mensajes antes de poder enviarla.`;
  }
  if (errCode === 131058) {
    return `Plantilla de prueba no admitida (#131058): La plantilla "hello_world" solo se puede usar con números de prueba de Sandbox de Meta, no en números en vivo de producción como +504 8756-3605.`;
  }
  if (errCode === 100) {
    return `Parámetros inválidos en Meta (#100): ${errMessage}`;
  }

  return `Error de Meta API (#${errCode || 'Desconocido'}): ${errMessage}`;
}

/**
 * Sends a WhatsApp Text Message via Meta WhatsApp Cloud API
 */
export async function sendTextMessage(toPhone: string, text: string): Promise<SendMessageResult> {
  const { accessToken, phoneNumberId } = getMetaConfig();
  const cleanRecipient = toPhone.replace(/\D/g, '');

  if (!cleanRecipient) {
    return { success: false, error: 'Número de destinatario inválido.' };
  }

  if (!text || !text.trim()) {
    return { success: false, error: 'El mensaje de texto no puede estar vacío.' };
  }

  // If live credentials are not set yet
  if (!accessToken || !phoneNumberId) {
    return {
      success: false,
      error: 'No se han configurado META_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID en los secretos del sistema.'
    };
  }

  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanRecipient,
      type: 'text',
      text: {
        preview_url: false,
        body: text
      }
    };

    const response = await fetch(`${META_GRAPH_BASE_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      const errCode = data?.error?.code;
      const errSubcode = data?.error?.error_subcode;
      const errType = data?.error?.type;
      const formattedError = formatMetaError(data, phoneNumberId, cleanRecipient);

      // Return formatted error safely to caller without dirtying server console logs
      return {
        success: false,
        error: formattedError,
        errorCode: errCode,
        errorSubcode: errSubcode,
        errorType: errType,
        metaResponse: data
      };
    }

    const messageId = data?.messages?.[0]?.id || `wamid.OUT_${Date.now()}`;
    return {
      success: true,
      messageId,
      metaResponse: data
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Error de red al conectar con Meta Cloud API: ${err.message}`
    };
  }
}

/**
 * Sends a WhatsApp Template Message via Meta WhatsApp Cloud API
 */
export async function sendTemplateMessage(
  toPhone: string,
  templateName: string,
  languageCode = 'es',
  components?: any[]
): Promise<SendMessageResult> {
  const { accessToken, phoneNumberId } = getMetaConfig();
  const cleanRecipient = toPhone.replace(/\D/g, '');

  if (!cleanRecipient) {
    return { success: false, error: 'Número de destinatario inválido.' };
  }

  if (!accessToken || !phoneNumberId) {
    return {
      success: false,
      error: 'No se han configurado META_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID en los secretos del sistema.'
    };
  }

  try {
    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanRecipient,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode }
      }
    };

    if (components && components.length > 0) {
      payload.template.components = components;
    }

    const response = await fetch(`${META_GRAPH_BASE_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      const errCode = data?.error?.code;
      const errSubcode = data?.error?.error_subcode;
      const errType = data?.error?.type;
      const formattedError = formatMetaError(data, phoneNumberId, cleanRecipient);

      // Return formatted error safely to caller without dirtying server console logs
      return {
        success: false,
        error: formattedError,
        errorCode: errCode,
        errorSubcode: errSubcode,
        errorType: errType,
        metaResponse: data
      };
    }

    return {
      success: true,
      messageId: data?.messages?.[0]?.id || `wamid.TPL_${Date.now()}`,
      metaResponse: data
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Error de red al conectar con Meta Cloud API: ${err.message}`
    };
  }
}

/**
 * Fetches officially approved templates directly from Meta WhatsApp Business Account
 */
export async function fetchMetaTemplates(): Promise<{
  success: boolean;
  templates?: any[];
  error?: string;
}> {
  const { accessToken, businessAccountId } = getMetaConfig();
  if (!accessToken || !businessAccountId) {
    return { success: false, error: 'Credenciales de Meta no configuradas.' };
  }

  try {
    const res = await fetch(`${META_GRAPH_BASE_URL}/${businessAccountId}/message_templates`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message || 'Error al obtener plantillas de Meta' };
    }
    return { success: true, templates: data.data || [] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Registers the phone number on WhatsApp Cloud API using a 6-digit PIN.
 * This resolves Meta error (#133010) "Account not registered".
 */
export async function registerPhoneNumberOnMeta(pin = '123456'): Promise<{ success: boolean; message: string; details?: any }> {
  const { accessToken, phoneNumberId } = getMetaConfig();

  if (!accessToken || !phoneNumberId) {
    return {
      success: false,
      message: 'Faltan credenciales: META_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID.'
    };
  }

  try {
    const url = `${META_GRAPH_BASE_URL}/${phoneNumberId}/register`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        pin: pin
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMessage = data?.error?.message || 'Error al registrar el número en Meta.';
      return {
        success: false,
        message: `Fallo de registro (${data?.error?.code || response.status}): ${errMessage}`,
        details: data?.error
      };
    }

    return {
      success: true,
      message: '¡Número registrado y activado exitosamente en Meta WhatsApp Cloud API!',
      details: data
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error de red al registrar número: ${err.message}`
    };
  }
}
