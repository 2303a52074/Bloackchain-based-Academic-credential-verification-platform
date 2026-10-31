// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/**
 * @title CredentialRegistry
 * @dev Immutable academic credential registry for cryptographic SHA-256 anchoring and verification.
 */
contract CredentialRegistry {
    address public owner;

    struct Credential {
        string id;
        bytes32 canonicalHash;
        address issuer;
        uint256 blockTimestamp;
        bool isRevoked;
    }

    // Mapping from canonicalHash to Credential record
    mapping(bytes32 => Credential) public credentials;

    // Mapping from Credential ID string to canonicalHash
    mapping(string => bytes32) public idToHash;

    // Authorized issuers
    mapping(address => bool) public authorizedIssuers;

    event CredentialIssued(
        string indexed id,
        bytes32 indexed canonicalHash,
        address indexed issuer,
        uint256 timestamp
    );

    event CredentialRevoked(
        string indexed id,
        bytes32 indexed canonicalHash,
        address indexed issuer,
        uint256 timestamp
    );

    event IssuerAuthorized(address indexed issuer);
    event IssuerDeauthorized(address indexed issuer);

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedIssuers[msg.sender],
            "CredentialRegistry: caller not authorized to issue"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    function setIssuerAuthorization(address issuer, bool authorized) external {
        require(msg.sender == owner, "CredentialRegistry: only owner can set authorization");
        authorizedIssuers[issuer] = authorized;
        if (authorized) {
            emit IssuerAuthorized(issuer);
        } else {
            emit IssuerDeauthorized(issuer);
        }
    }

    /**
     * @notice Anchor a newly issued academic credential hash
     * @param id Unique credential identifier (e.g. CRD-2026-...)
     * @param canonicalHash Deterministic SHA-256 hash of credential data
     */
    function issueCredential(string calldata id, bytes32 canonicalHash) external onlyAuthorized {
        require(canonicalHash != bytes32(0), "CredentialRegistry: hash cannot be empty");
        require(bytes(id).length > 0, "CredentialRegistry: id cannot be empty");
        require(credentials[canonicalHash].canonicalHash == bytes32(0), "CredentialRegistry: credential hash already anchored");
        require(idToHash[id] == bytes32(0), "CredentialRegistry: credential id already exists");

        credentials[canonicalHash] = Credential({
            id: id,
            canonicalHash: canonicalHash,
            issuer: msg.sender,
            blockTimestamp: block.timestamp,
            isRevoked: false
        });

        idToHash[id] = canonicalHash;

        emit CredentialIssued(id, canonicalHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Revoke an issued credential
     */
    function revokeCredential(string calldata id) external onlyAuthorized {
        bytes32 hash = idToHash[id];
        require(hash != bytes32(0), "CredentialRegistry: credential does not exist");
        require(!credentials[hash].isRevoked, "CredentialRegistry: already revoked");

        credentials[hash].isRevoked = true;
        emit CredentialRevoked(id, hash, msg.sender, block.timestamp);
    }

    /**
     * @notice Verify a credential by its canonical SHA-256 hash
     */
    function verifyCredential(bytes32 canonicalHash) external view returns (
        bool exists,
        bool isRevoked,
        address issuer,
        uint256 timestamp,
        string memory id
    ) {
        Credential storage cred = credentials[canonicalHash];
        if (cred.canonicalHash == bytes32(0)) {
            return (false, false, address(0), 0, "");
        }
        return (true, cred.isRevoked, cred.issuer, cred.blockTimestamp, cred.id);
    }

    /**
     * @notice Get credential hash by ID
     */
    function getHashById(string calldata id) external view returns (bytes32) {
        return idToHash[id];
    }
}
