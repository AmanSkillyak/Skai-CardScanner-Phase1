import request from 'supertest';
import app from '../app';

const expectErrorEnvelope = (body: unknown, code: string) => {
  expect(body).toEqual(expect.objectContaining({
    error: expect.objectContaining({
      code,
      message: expect.any(String),
    }),
  }));
};

describe('backend API safety routes', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('allows the local Vite dev server on port 5173', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('POST /api/scans without a file returns standard error envelope', async () => {
    const res = await request(app).post('/api/scans');

    expect(res.status).toBe(400);
    expectErrorEnvelope(res.body, 'VALIDATION_ERROR');
    expect(res.body.error.message).toBe('No file uploaded');
  });

  it('POST /api/scans with invalid upload type returns standard error envelope', async () => {
    const res = await request(app)
      .post('/api/scans')
      .attach('file', Buffer.from('not a card'), {
        filename: 'card.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(415);
    expectErrorEnvelope(res.body, 'UPLOAD_ERROR');
  });

  it('POST /api/exports with empty ids returns validation error envelope', async () => {
    const res = await request(app)
      .post('/api/exports')
      .send({ ids: [] });

    expect(res.status).toBe(400);
    expectErrorEnvelope(res.body, 'VALIDATION_ERROR');
  });

  it('POST /api/exports with empty contact_ids returns validation error envelope', async () => {
    const res = await request(app)
      .post('/api/exports')
      .send({ contact_ids: [] });

    expect(res.status).toBe(400);
    expectErrorEnvelope(res.body, 'VALIDATION_ERROR');
  });

  it('POST /api/categories/suggest without raw text or keywords returns validation error envelope', async () => {
    const res = await request(app)
      .post('/api/categories/suggest')
      .send({ company_name: 'Example Co' });

    expect(res.status).toBe(400);
    expectErrorEnvelope(res.body, 'VALIDATION_ERROR');
  });

  it('POST /api/contacts with empty body returns validation error envelope', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .send({});

    expect(res.status).toBe(400);
    expectErrorEnvelope(res.body, 'VALIDATION_ERROR');
  });
});
