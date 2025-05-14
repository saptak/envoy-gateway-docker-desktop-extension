describe('Gateway Management E2E Tests', () => {
  beforeEach(() => {
    // Mock API responses
    cy.mockApiResponse('/gateways', 'gateways');
    cy.mockApiResponse('/health');
    cy.mockApiResponse('/metrics');
    
    // Visit the application
    cy.visit('/');
    
    // Wait for initial API calls
    cy.waitForApiCall('/gateways');
  });

  it('should load the application and display gateways', () => {
    cy.get('[data-testid="app-header"]').should('be.visible');
    cy.get('[data-testid="sidebar"]').should('be.visible');
    cy.get('[data-testid="gateways-page"]').should('be.visible');
    
    // Check if gateways are displayed
    cy.get('[data-testid="gateway-list"]').should('be.visible');
    cy.get('[data-testid="gateway-row"]').should('have.length', 2);
  });

  it('should navigate between pages', () => {
    // Navigate to routes page
    cy.get('[data-testid="sidebar-routes"]').click();
    cy.url().should('include', '/routes');
    cy.get('[data-testid="routes-page"]').should('be.visible');
    
    // Navigate to monitoring page
    cy.get('[data-testid="sidebar-monitoring"]').click();
    cy.url().should('include', '/monitoring');
    cy.get('[data-testid="monitoring-page"]').should('be.visible');
    
    // Navigate back to gateways
    cy.get('[data-testid="sidebar-gateways"]').click();
    cy.url().should('include', '/gateways');
    cy.get('[data-testid="gateways-page"]').should('be.visible');
  });

  it('should create a new gateway', () => {
    // Mock the create gateway API
    cy.intercept('POST', '**/api/gateways', {
      statusCode: 201,
      body: {
        apiVersion: 'gateway.networking.k8s.io/v1',
        kind: 'Gateway',
        metadata: {
          name: 'new-test-gateway',
          namespace: 'default'
        },
        spec: {
          gatewayClassName: 'envoy-gateway',
          listeners: [
            {
              name: 'http',
              port: 8080,
              protocol: 'HTTP'
            }
          ]
        }
      }
    }).as('createGateway');

    // Create a new gateway
    cy.createGateway({
      name: 'new-test-gateway',
      namespace: 'default',
      gatewayClassName: 'envoy-gateway',
      listeners: [
        {
          name: 'http',
          port: 8080,
          protocol: 'HTTP'
        }
      ]
    });

    // Verify the API call was made
    cy.wait('@createGateway');
    
    // Check for success message
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.get('[data-testid="success-message"]').should('contain', 'Gateway created successfully');
  });

  it('should handle gateway creation errors', () => {
    // Mock the create gateway API to return an error
    cy.intercept('POST', '**/api/gateways', {
      statusCode: 400,
      body: {
        error: 'Gateway name already exists'
      }
    }).as('createGatewayError');

    // Try to create a gateway with existing name
    cy.createGateway({
      name: 'test-gateway-1',
      namespace: 'default',
      gatewayClassName: 'envoy-gateway',
      listeners: [
        {
          name: 'http',
          port: 80,
          protocol: 'HTTP'
        }
      ]
    });

    // Verify the API call was made
    cy.wait('@createGatewayError');
    
    // Check for error message
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Gateway name already exists');
  });

  it('should delete a gateway', () => {
    // Mock the delete gateway API
    cy.intercept('DELETE', '**/api/gateways/test-gateway-1/default', {
      statusCode: 200,
      body: { message: 'Gateway deleted successfully' }
    }).as('deleteGateway');

    // Delete the first gateway
    cy.deleteGateway('test-gateway-1', 'default');

    // Verify the API call was made
    cy.wait('@deleteGateway');
    
    // Check for success message
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.get('[data-testid="success-message"]').should('contain', 'Gateway deleted successfully');
  });

  it('should filter gateways by search', () => {
    // Search for a specific gateway
    cy.get('[data-testid="gateway-search"]').type('test-gateway-1');
    
    // Should show only matching gateways
    cy.get('[data-testid="gateway-row"]').should('have.length', 1);
    cy.get('[data-testid="gateway-row"]').should('contain', 'test-gateway-1');
    
    // Clear search
    cy.get('[data-testid="gateway-search"]').clear();
    cy.get('[data-testid="gateway-row"]').should('have.length', 2);
  });

  it('should show gateway details', () => {
    // Click on the first gateway
    cy.get('[data-testid="gateway-row-test-gateway-1"]').click();
    
    // Should navigate to gateway details
    cy.url().should('include', '/gateways/test-gateway-1');
    cy.get('[data-testid="gateway-details"]').should('be.visible');
    
    // Check gateway information
    cy.get('[data-testid="gateway-name"]').should('contain', 'test-gateway-1');
    cy.get('[data-testid="gateway-namespace"]').should('contain', 'default');
    cy.get('[data-testid="gateway-class"]').should('contain', 'envoy-gateway');
  });

  it('should handle connection status', () => {
    // Mock disconnected state
    cy.intercept('GET', '**/api/health', {
      statusCode: 500,
      body: { error: 'Connection failed' }
    }).as('healthCheck');

    // Reload the page
    cy.reload();
    
    // Wait for health check
    cy.wait('@healthCheck');
    
    // Should show disconnected status
    cy.get('[data-testid="connection-status"]').should('be.visible');
    cy.get('[data-testid="connection-status"]').should('contain', 'Disconnected');
    
    // Should show connection error
    cy.get('[data-testid="connection-error"]').should('be.visible');
  });

  it('should refresh gateways list', () => {
    // Click refresh button
    cy.get('[data-testid="refresh-gateways"]').click();
    
    // Should make API call again
    cy.wait('@getgateways');
    
    // Should show loading state temporarily
    cy.get('[data-testid="loading-spinner"]').should('be.visible');
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
  });

  it('should handle pagination', () => {
    // Mock response with many gateways
    cy.intercept('GET', '**/api/gateways', {
      fixture: 'many-gateways.json'
    }).as('getManyGateways');
    
    cy.reload();
    cy.wait('@getManyGateways');
    
    // Should show pagination controls
    cy.get('[data-testid="pagination"]').should('be.visible');
    cy.get('[data-testid="next-page"]').click();
    
    // Should navigate to next page
    cy.get('[data-testid="current-page"]').should('contain', '2');
  });

  it('should validate form inputs', () => {
    // Open create gateway modal
    cy.get('[data-testid="create-gateway-btn"]').click();
    
    // Try to submit without required fields
    cy.get('[data-testid="create-gateway-submit"]').click();
    
    // Should show validation errors
    cy.get('[data-testid="name-error"]').should('be.visible');
    cy.get('[data-testid="name-error"]').should('contain', 'Name is required');
    
    // Fill in invalid port
    cy.get('[data-testid="gateway-name-input"]').type('test-gateway');
    cy.get('[data-testid="listener-port-0"]').clear().type('70000');
    
    // Should show port validation error
    cy.get('[data-testid="port-error"]').should('be.visible');
    cy.get('[data-testid="port-error"]').should('contain', 'Port must be between 1 and 65535');
  });

  it('should support keyboard navigation', () => {
    // Navigate using tab key
    cy.get('body').tab();
    cy.focused().should('have.attr', 'data-testid', 'create-gateway-btn');
    
    // Open modal with Enter key
    cy.focused().type('{enter}');
    cy.get('[data-testid="gateway-modal"]').should('be.visible');
    
    // Navigate form with tab
    cy.focused().tab();
    cy.focused().should('have.attr', 'data-testid', 'gateway-name-input');
    
    // Close modal with Escape key
    cy.get('body').type('{esc}');
    cy.get('[data-testid="gateway-modal"]').should('not.exist');
  });
});