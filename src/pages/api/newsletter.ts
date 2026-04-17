import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    // Validation
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email requis' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Email invalide' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if Brevo API key is configured
    const apiKey = import.meta.env.BREVO_API_KEY;
    const listId = import.meta.env.BREVO_LIST_ID;

    if (!apiKey || !listId) {
      console.error('Brevo API not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporairement indisponible' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Add contact to Brevo
    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        listIds: [parseInt(listId)],
        updateEnabled: true,
      }),
    });

    const brevoData = await brevoResponse.json();

    // Handle Brevo errors
    if (!brevoResponse.ok) {
      // Already subscribed
      if (brevoResponse.status === 400 && brevoData.code === 'duplicate_parameter') {
        return new Response(
          JSON.stringify({ message: 'Vous êtes déjà inscrit à notre newsletter !' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      console.error('Brevo API error:', brevoData);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'inscription' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Success
    return new Response(
      JSON.stringify({ message: 'Inscription réussie ! Vérifiez votre boîte mail.' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
