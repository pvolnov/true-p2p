const sender = Ethers.send("eth_requestAccounts", [])[0];
if (!sender) return "Please login first";
const signer = Ethers.provider().getSigner();

const PaymentRequest =
  "(address payable requester, uint256 amount, bytes32 zelleEmailHash, address payable executor)";
const abi = [
  "function createPaymentRequest(uint256 amount, bytes32 _zelleEmailHash) external returns (uint256)",
  `function getPaymentRequestsByIds(uint256[] memory requestIds) external view returns (${PaymentRequest}[] memory)`,
  "function reservePayment(uint256 requestId)",
  "function confirmPayment(uint256 requestId, uint256 transactionId)",
  "event PaymentReserved(uint256 requestId, address indexed reserver)",
];

const CONTRACT = "0xbeC6a3A108552e6ea9f3aa609847eBF4135bBE71";
const tokenAddress = "0x8c9e6c40d3402480ACE624730524fACC5482798c";
const erc20abi = ["function approve(address _spender, uint _value)"];
const erc20 = new ethers.Contract(tokenAddress, erc20abi, signer);
const peer2peer = new ethers.Contract(CONTRACT, abi, signer);
const daiDecimal = 18;

peer2peer.getPaymentRequestsByIds([props.order]).then(([data]) => {
  State.update({
    order: {
      requester: data[0],
      amount: ethers.utils.formatEther(data[1], daiDecimal),
      zelleHash: data[2],
      executor: data[3],
    },
  });
});

const handleVerify = (proof) => {
  console.log("handleVerify", props.order, proof.transactionId);
  peer2peer
    .confirmPayment(props.order, proof.transactionId, { gasLimit: 3000000 })
    .then((tx) => {
      tx.wait().then(() => {
        State.update({ isSuccess: true });
        console.log("SUCCESS!!");
      });
    });
};

const order = state.order;
if (!order) return "";

if (isSuccess) {
  return (
    <h2 style={{ textAlign: "center", margin: 48 }}>
      Success! You buy {order.amount} DAI
    </h2>
  );
}

const Container = styled.div`
  * {
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
      Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  }

  display: flex;
  justify-content: center;
  flex-direction: column;
  width: 400px;
`;

const isRequester = order.requester.toLowerCase() === sender.toLowerCase();
const isExecuter = order.executor.toLowerCase() === sender.toLowerCase();

return (
  <div
    style={{
      display: "flex",
      gap: 32,
      justifyContent: "center",
      marginTop: 32,
      width: "100%",
    }}
  >
    <Container>
      <h4 style={{ lineBreak: "anywhere" }}>
        {isRequester ? "Your order, you SELL" : order.requester}
      </h4>
      <h5 style={{ marginBottom: 32 }}>{order.amount} DAI</h5>

      {order.executor !== "0x0000000000000000000000000000000000000000" && (
        <Widget
          src="azbang.near/widget/xmtp-chat"
          props={{ receiver: isRequester ? order.executor : order.requester }}
        />
      )}

      {order.executor === "0x0000000000000000000000000000000000000000" && (
        <div
          style={{
            margin: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 100,
          }}
        >
          <p style={{ marginTop: 24 }}>Wait order executor</p>
          <Widget
            src="azbang.near/widget/dots-spinner"
            props={{
              style: {
                height: 32,
                display: "flex",
                alignItems: "center",
                margin: "auto",
              },
            }}
          />
        </div>
      )}
    </Container>
    {isExecuter && (
      <div style={{ marginTop: -48 }}>
        <Widget
          src="azbang.near/widget/plaid"
          props={{
            debug: true,
            onVerified: handleVerify,
            public_token: props.public_token,
            widgetSrc: "azbang.near/widget/peer2peer",
          }}
        />
      </div>
    )}
  </div>
);
