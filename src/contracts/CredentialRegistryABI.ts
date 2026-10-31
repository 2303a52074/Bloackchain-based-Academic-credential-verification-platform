export const CREDENTIAL_REGISTRY_ABI = [
  "event CredentialIssued(string indexed id, bytes32 indexed canonicalHash, address indexed issuer, uint256 timestamp)",
  "event CredentialRevoked(string indexed id, bytes32 indexed canonicalHash, address indexed issuer, uint256 timestamp)",
  "event IssuerAuthorized(address indexed issuer)",
  "event IssuerDeauthorized(address indexed issuer)",
  "function owner() view returns (address)",
  "function authorizedIssuers(address) view returns (bool)",
  "function setIssuerAuthorization(address issuer, bool authorized)",
  "function issueCredential(string calldata id, bytes32 canonicalHash)",
  "function revokeCredential(string calldata id)",
  "function verifyCredential(bytes32 canonicalHash) view returns (bool exists, bool isRevoked, address issuer, uint256 timestamp, string memory id)",
  "function getHashById(string calldata id) view returns (bytes32)"
] as const;
