export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (url.pathname === '/health') {
      return json(
        {
          status: 'ok',
          service: 'rifkdoc-worker',
          time: new Date().toISOString(),
        },
        200,
      );
    }

    if (url.pathname === '/config') {
      return json(
        {
          name: 'Rifkdoc API',
          mode: 'starter',
          note: 'Gunakan Worker ini untuk health check, logging, signed upload URL, atau fitur premium berikutnya.',
        },
        200,
      );
    }

    return json(
      {
        error: 'Not found',
      },
      404,
    );
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,OPTIONS',
    'access-control-allow-headers': 'Content-Type',
  };
}
