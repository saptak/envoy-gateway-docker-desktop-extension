/// <reference types="cypress" />

// Import commands.ts using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

declare global {
  namespace Cypress {
    interface Chainable {
      mockApiResponse(endpoint: string, fixture?: string): Chainable<Element>
      waitForApiCall(endpoint: string): Chainable<Element>
      createGateway(gatewayData: any): Chainable<Element>
      deleteGateway(name: string, namespace: string): Chainable<Element>
    }
  }
}