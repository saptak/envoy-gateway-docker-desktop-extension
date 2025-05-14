// Mock for socket.io
const mockEmit = jest.fn();
const mockToEmit = jest.fn();
const mockTo = jest.fn().mockReturnValue({
  emit: mockToEmit,
});
const mockOn = jest.fn();

const mockServer = {
  on: mockOn,
  to: mockTo,
  emit: mockEmit,
  use: jest.fn(),
  close: jest.fn(),
  listen: jest.fn(),
};

module.exports = {
  Server: jest.fn().mockImplementation(() => mockServer),
  // Export mock functions for test assertions
  mockServer,
  mockEmit,
  mockToEmit,
  mockTo,
  mockOn,
};
