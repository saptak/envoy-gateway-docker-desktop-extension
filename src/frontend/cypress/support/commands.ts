/// <reference types="cypress" />

// Custom commands for Envoy Gateway Extension testing

Cypress.Commands.add('mockApiResponse', (endpoint: string, fixture?: string) => {
  const fixtureFile = fixture || endpoint.replace('/', '');
  cy.intercept('GET', `**/api${endpoint}`, { fixture: `${fixtureFile}.json` }).as(`get${endpoint.replace('/', '')}`);
});

Cypress.Commands.add('waitForApiCall', (endpoint: string) => {
  const alias = endpoint.replace('/', '');
  cy.wait(`@get${alias}`);
});

Cypress.Commands.add('createGateway', (gatewayData: any) => {
  cy.get('[data-testid="create-gateway-btn"]').click();
  cy.get('[data-testid="gateway-name-input"]').type(gatewayData.name);
  cy.get('[data-testid="gateway-namespace-input"]').clear().type(gatewayData.namespace);
  cy.get('[data-testid="gateway-class-select"]').select(gatewayData.gatewayClassName);
  
  // Add listeners if provided
  if (gatewayData.listeners && gatewayData.listeners.length > 1) {
    for (let i = 1; i < gatewayData.listeners.length; i++) {
      cy.get('[data-testid="add-listener-btn"]').click();
    }
  }
  
  gatewayData.listeners?.forEach((listener: any, index: number) => {
    cy.get(`[data-testid="listener-name-${index}"]`).type(listener.name);
    cy.get(`[data-testid="listener-port-${index}"]`).clear().type(listener.port.toString());
    cy.get(`[data-testid="listener-protocol-${index}"]`).select(listener.protocol);
    if (listener.hostname) {
      cy.get(`[data-testid="listener-hostname-${index}"]`).type(listener.hostname);
    }
  });
  
  cy.get('[data-testid="create-gateway-submit"]').click();
});

Cypress.Commands.add('deleteGateway', (name: string, namespace: string) => {
  cy.get(`[data-testid="gateway-row-${name}"]`).within(() => {
    cy.get('[data-testid="delete-gateway-btn"]').click();
  });
  cy.get('[data-testid="confirm-delete-btn"]').click();
});