// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

interface ITransactionChecker {
    struct Transaction {
        int256 amount;
        string name;
        int256 timestamp;
        address sender;
    }

    function getTransaction(bytes32 transactionId) external view returns (Transaction memory);
}

contract P2PPayments {
    struct PaymentRequest {
        address payable requester;
        uint256 amount;
        bytes32 zelleEmailHash;
        address payable executor;
    }

    IERC20 public usdtToken;
    ITransactionChecker public checkerContract;

    mapping(uint256 => PaymentRequest) public requests;
    uint256 public nextRequestId = 1;
    uint256 public minEthReserveAmount = 0.001 ether;
    address owner;

    // Events to log payment-related actions
    event PaymentRequested(uint256 requestId, address indexed requester, uint256 amount, bytes32 zelleEmailHash);
    event PaymentReserved(uint256 requestId, address indexed reserver);
    event PaymentConfirmed(uint256 requestId, address indexed confirmer);

    // Constructor to initialize the contract with addresses of ERC20 token and TransactionChecker
    constructor(address _usdtToken, address _checkerContract) {
        usdtToken = IERC20(_usdtToken);
        checkerContract = ITransactionChecker(_checkerContract);
        owner = msg.sender;
    }

    // Modifier to allow only the requester to perform certain actions
    modifier onlyRequester(uint256 requestId) {
        require(msg.sender == requests[requestId].requester, "Only the requester can perform this action");
        _;
    }

    // Modifier to ensure that a payment has not been reserved
    modifier paymentNotReserved(uint256 requestId) {
        require(requests[requestId].executor == address(0), "Payment already reserved");
        _;
    }

    // Function to create a new payment request
    function createPaymentRequest(uint256 amount, bytes32 _zelleEmailHash) external {
        require(amount == 10 || amount == 100, "Invalid amount");

        requests[nextRequestId] = PaymentRequest({
            requester: payable(msg.sender),
            amount: amount,
            zelleEmailHash: _zelleEmailHash,
            executor: payable(address(0))
        });

        emit PaymentRequested(nextRequestId, msg.sender, amount, _zelleEmailHash);
        nextRequestId++;
    }

    // reserve a payment so avoid parallel execution
    function reservePayment(uint256 requestId) external payable paymentNotReserved(requestId) {
        require(msg.value >= minEthReserveAmount, "Transaction must include at least 0.001 ETH");

        PaymentRequest storage request = requests[requestId];

        usdtToken.transferFrom(request.requester, address(this), request.amount);
        request.executor = payable(msg.sender);

        emit PaymentReserved(requestId, msg.sender);
    }

    // Modifier to allow only the owner of the contract to call certain functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    // set the minimum ETH fee amount
    function set_minEthReserveAmount(uint256 _minEthReserveAmount) public onlyOwner {
        minEthReserveAmount = _minEthReserveAmount;
    }

    // withdraw ETH from the contract (only owner)
    function withdrawEther() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // confirm a payment
    function confirmPayment(uint256 requestId, bytes32 transactionId) external onlyRequester(requestId) {
        PaymentRequest storage request = requests[requestId];

        require(request.executor == msg.sender, "Only executor can close request");

        // check proof from LIT protocol gateaway
        ITransactionChecker.Transaction memory transaction = checkerContract.getTransaction(transactionId);
        require(keccak256(abi.encodePacked(transaction.name)) == request.zelleEmailHash, "Invalid transaction name hash");

        // complete transfer
        usdtToken.transfer(request.executor, request.amount);

        delete requests[requestId];
        emit PaymentConfirmed(requestId, msg.sender);
    }

    // Function to get payment requests by their IDs
    function getPaymentRequestsByIds(uint256[] memory requestIds) external view returns (PaymentRequest[] memory) {
        uint256 count = requestIds.length;
        PaymentRequest[] memory result = new PaymentRequest[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 requestId = requestIds[i];
            require(requestId > 0 && requestId < nextRequestId, "Invalid request ID");
            result[i] = requests[requestId];
        }

        return result;
    }
}
