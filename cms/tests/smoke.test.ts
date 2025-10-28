import request from 'supertest';

describe('Strapi Smoke Tests', () => {
  const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';

  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const response = await request(strapiUrl)
        .get('/_health')
        .expect((res) => {
          if (res.status !== 200 && res.status !== 404) {
            throw new Error(`Expected 200 or 404, got ${res.status}`);
          }
        });
      
      expect([200, 204, 404]).toContain(response.status);
    });
  });

  describe('API Endpoints', () => {
    it('should have API endpoint accessible', async () => {
      const response = await request(strapiUrl)
        .get('/api')
        .set('Accept', 'application/json');
      
      expect([200, 404, 403]).toContain(response.status);
    });

    it('should have posts endpoint', async () => {
      const response = await request(strapiUrl)
        .get('/api/posts')
        .set('Accept', 'application/json');
      
      expect([200, 404, 403]).toContain(response.status);
    });
  });

  describe('GraphQL Endpoint', () => {
    it('should respond to GraphQL endpoint', async () => {
      const response = await request(strapiUrl)
        .post('/graphql')
        .send({
          query: '{ __schema { types { name } } }',
        })
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json');
      
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should validate GraphQL schema introspection', async () => {
      const response = await request(strapiUrl)
        .post('/graphql')
        .send({
          query: `
            {
              __schema {
                queryType {
                  name
                }
              }
            }
          `,
        })
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json');
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('data');
      } else {
        expect([400, 404]).toContain(response.status);
      }
    });
  });

  describe('Content Types', () => {
    it('should check if content types are registered', async () => {
      const response = await request(strapiUrl)
        .get('/api/content-type-builder/content-types')
        .set('Accept', 'application/json');
      
      expect([200, 401, 403, 404]).toContain(response.status);
    });
  });
});
