// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TransactionStorage {
    struct Transaction {
        int256 amount;
        string name;
        int256 timestamp;
        address sender;
    }

    event NewTransaction(bytes32 transaction_id, int256 amount);
    address constant SIGNER_ADDRESS = 0xe156276E5d9c5920661F90C3c35906adefD6C437;
    mapping(bytes32 => Transaction) private transactions;

    // Function to add a new transaction to the storage
    function addTransaction(bytes memory serializedData, bytes32 r, bytes32 s, uint8 v) public {
        // Calculate the hash of the serialized data
        bytes32 hash = keccak256(serializedData);

        // Recover the address of the signer using the provided signature
        address signer = ecrecover(hash, v, r, s);

        // Ensure that the signer is the expected signer from LIT Protocol
        require(signer == SIGNER_ADDRESS, "Invalid signature");

        // Decode the serialized data to extract transaction details
        (bytes32 transaction_id, int256 amount, string memory name, int256 timestamp) = abi.decode(serializedData, (bytes32, int256, string, int256));

        Transaction memory trx = Transaction({
            amount: amount,
            name: name,
            timestamp: timestamp,
            sender: msg.sender
        });

        emit NewTransaction(transaction_id, amount);
        transactions[transaction_id] = trx;
    }

    function getTransaction(bytes32 transaction_id) public view returns (Transaction memory) {
        return transactions[transaction_id];
    }
}
