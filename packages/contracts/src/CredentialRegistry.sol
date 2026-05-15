// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CredentialRegistry {
    enum CredentialType {
        EDUCATION,
        EMPLOYMENT,
        WORKSHOP,
        LICENSE,
        OTHER
    }

    struct Credential {
        bytes32 documentHash;
        bytes32 holderDIDHash;
        address issuer;
        CredentialType credentialType;
        uint256 issuedAt;
        bool revoked;
    }

    address public owner;

    mapping(address => bool) public ndiIssuerRegistry;
    mapping(address => bytes32) public holderDIDHash;
    mapping(address => bytes32) public ndiLinkedDID;
    mapping(bytes32 => Credential) public credentials;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event IssuerRegistered(address indexed issuer, bytes32 indexed issuerDIDHash);
    event IssuerRevoked(address indexed issuer);
    event HolderDIDRegistered(address indexed holder, bytes32 indexed didHash);
    event CredentialIssued(
        bytes32 indexed credentialId,
        bytes32 indexed documentHash,
        bytes32 indexed holderDIDHash,
        address issuer,
        CredentialType credentialType,
        uint256 issuedAt
    );
    event CredentialRevoked(bytes32 indexed credentialId, address indexed issuer);

    error NotOwner();
    error NotNDIIssuer();
    error InvalidAddress();
    error MissingDIDHash();
    error CredentialAlreadyExists();
    error CredentialNotFound();
    error CredentialAlreadyRevoked();
    error NotCredentialIssuer();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyNDIIssuer() {
        if (!ndiIssuerRegistry[msg.sender] || ndiLinkedDID[msg.sender] == bytes32(0)) revert NotNDIIssuer();
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function registerIssuer(address issuer, bytes32 issuerDIDHash) external onlyOwner {
        if (issuer == address(0)) revert InvalidAddress();
        if (issuerDIDHash == bytes32(0)) revert MissingDIDHash();

        ndiIssuerRegistry[issuer] = true;
        ndiLinkedDID[issuer] = issuerDIDHash;

        emit IssuerRegistered(issuer, issuerDIDHash);
    }

    function revokeIssuer(address issuer) external onlyOwner {
        if (issuer == address(0)) revert InvalidAddress();

        ndiIssuerRegistry[issuer] = false;

        emit IssuerRevoked(issuer);
    }

    function registerHolderDID(address holder, bytes32 didHash) external {
        if (holder == address(0)) revert InvalidAddress();
        if (didHash == bytes32(0)) revert MissingDIDHash();
        if (msg.sender != holder && msg.sender != owner) revert NotOwner();

        holderDIDHash[holder] = didHash;

        emit HolderDIDRegistered(holder, didHash);
    }

    function issueCredential(
        bytes32 credentialId,
        bytes32 documentHash,
        bytes32 holderDIDHash_,
        CredentialType credentialType
    ) external onlyNDIIssuer {
        if (credentialId == bytes32(0) || documentHash == bytes32(0) || holderDIDHash_ == bytes32(0)) revert MissingDIDHash();
        if (credentials[credentialId].issuedAt != 0) revert CredentialAlreadyExists();

        credentials[credentialId] = Credential({
            documentHash: documentHash,
            holderDIDHash: holderDIDHash_,
            issuer: msg.sender,
            credentialType: credentialType,
            issuedAt: block.timestamp,
            revoked: false
        });

        emit CredentialIssued(credentialId, documentHash, holderDIDHash_, msg.sender, credentialType, block.timestamp);
    }

    function verifyCredential(bytes32 credentialId)
        external
        view
        returns (bool valid, address issuer, CredentialType credentialType, uint256 issuedAt)
    {
        Credential memory credential = credentials[credentialId];
        if (credential.issuedAt == 0) {
            return (false, address(0), CredentialType.OTHER, 0);
        }

        return (!credential.revoked && ndiIssuerRegistry[credential.issuer], credential.issuer, credential.credentialType, credential.issuedAt);
    }

    function revokeCredential(bytes32 credentialId) external {
        Credential storage credential = credentials[credentialId];
        if (credential.issuedAt == 0) revert CredentialNotFound();
        if (credential.issuer != msg.sender) revert NotCredentialIssuer();
        if (credential.revoked) revert CredentialAlreadyRevoked();

        credential.revoked = true;

        emit CredentialRevoked(credentialId, msg.sender);
    }

    function getCredential(bytes32 credentialId) external view returns (Credential memory) {
        Credential memory credential = credentials[credentialId];
        if (credential.issuedAt == 0) revert CredentialNotFound();

        return credential;
    }
}
