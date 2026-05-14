// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract MultiSigWallet {
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
    }

    address[] public owners;
    uint256 public threshold;

    mapping(address => bool) public isOwner;
    mapping(uint256 => mapping(address => bool)) public approved;

    Transaction[] public transactions;

    event Deposit(address indexed sender, uint256 amount);
    event TransactionSubmitted(
        uint256 indexed txIndex,
        address indexed owner,
        address indexed to,
        uint256 value,
        bytes data
    );
    event TransactionApproved(uint256 indexed txIndex, address indexed owner);
    event ApprovalRevoked(uint256 indexed txIndex, address indexed owner);
    event TransactionExecuted(uint256 indexed txIndex, address indexed owner);
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event ThresholdChanged(uint256 threshold);

    modifier onlyOwner() {
        require(isOwner[msg.sender], "MultiSigWallet: caller is not an owner");
        _;
    }

    modifier txExists(uint256 txIndex) {
        require(txIndex < transactions.length, "MultiSigWallet: transaction does not exist");
        _;
    }

    modifier notExecuted(uint256 txIndex) {
        require(!transactions[txIndex].executed, "MultiSigWallet: transaction already executed");
        _;
    }

    modifier onlyWallet() {
        require(msg.sender == address(this), "MultiSigWallet: caller is not wallet");
        _;
    }

    constructor() {
        owners.push(msg.sender);
        isOwner[msg.sender] = true;
        threshold = 1;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function submitTransaction(address to, uint256 value, bytes calldata data) external onlyOwner {
        require(to != address(0), "MultiSigWallet: target is zero address");

        transactions.push(Transaction({ to: to, value: value, data: data, executed: false, numConfirmations: 0 }));

        emit TransactionSubmitted(transactions.length - 1, msg.sender, to, value, data);
    }

    function approveTransaction(uint256 txIndex) external onlyOwner txExists(txIndex) notExecuted(txIndex) {
        require(!approved[txIndex][msg.sender], "MultiSigWallet: transaction already approved");

        approved[txIndex][msg.sender] = true;
        transactions[txIndex].numConfirmations += 1;

        emit TransactionApproved(txIndex, msg.sender);
    }

    function revokeApproval(uint256 txIndex) external onlyOwner txExists(txIndex) notExecuted(txIndex) {
        require(approved[txIndex][msg.sender], "MultiSigWallet: transaction not approved");

        approved[txIndex][msg.sender] = false;
        transactions[txIndex].numConfirmations -= 1;

        emit ApprovalRevoked(txIndex, msg.sender);
    }

    function executeTransaction(uint256 txIndex) external onlyOwner txExists(txIndex) notExecuted(txIndex) {
        Transaction storage transaction = transactions[txIndex];
        require(transaction.numConfirmations >= threshold, "MultiSigWallet: insufficient approvals");

        transaction.executed = true;

        (bool success, ) = transaction.to.call{ value: transaction.value }(transaction.data);
        require(success, "MultiSigWallet: transaction failed");

        emit TransactionExecuted(txIndex, msg.sender);
    }

    function addOwner(address newOwner) external onlyWallet {
        require(newOwner != address(0), "MultiSigWallet: owner is zero address");
        require(!isOwner[newOwner], "MultiSigWallet: owner already exists");

        owners.push(newOwner);
        isOwner[newOwner] = true;

        emit OwnerAdded(newOwner);
    }

    function removeOwner(address owner) external onlyWallet {
        require(isOwner[owner], "MultiSigWallet: owner does not exist");
        require(owners.length - 1 >= threshold, "MultiSigWallet: owner count below threshold");

        isOwner[owner] = false;

        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }

        emit OwnerRemoved(owner);
    }

    function changeThreshold(uint256 newThreshold) external onlyWallet {
        require(newThreshold > 0, "MultiSigWallet: threshold is zero");
        require(newThreshold <= owners.length, "MultiSigWallet: threshold exceeds owner count");

        threshold = newThreshold;

        emit ThresholdChanged(newThreshold);
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(uint256 txIndex) external view txExists(txIndex) returns (Transaction memory) {
        return transactions[txIndex];
    }
}
