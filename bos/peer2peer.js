State.init({
  orders: [],
  amount: "0.001",
});

const sender = Ethers.send("eth_requestAccounts", [])[0];
if (!sender) return "Please login first";

const Button = styled.button`
  color: #fff;
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #255ff4;
  padding: 16px;
  width: 250px;
  border-radius: 32px;
  border: none;
  text-align: center;
  font-weight: bold;
  transition: 0.2s all;
  height: 64px;
  &:hover {
    color: #fff;
    text-decoration: none;
    background-color: rgb(107 148 255);
  }
`;

const Container = styled.div`
  * {
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
      Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  }

  display: flex;
  margin: 48px auto;
  justify-content: center;
  flex-direction: column;
  width: 400px;
  gap: 16px;

  button {
    width: 100%;
  }

  input {
    height: 56px;
  }
`;

const AmountButton = styled(Button)`
  box-shadow: 0 0 0 0 #fff;
  height: 48px;
  &.active {
    box-shadow: 0 0 0 4px #fff;
  }
`;

const Info = styled.div`
  padding: 12px;
  border: 1px solid #6c757d88;
  color: #ccc;
  border-radius: 12px;
  margin-top: -8px;
`;

const Transaction = styled.div`
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #ccc;
  display: flex;
  flex-direction: row;
  position: relative;
  cursor: pointer;
  transition: 0.2s box-shadow;
  p {
    margin: 0;
  }
  margin-bottom: 12px;

  &:hover {
    box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.1);
  }
`;

const CONTRACT = "0xbeC6a3A108552e6ea9f3aa609847eBF4135bBE71";
const tokenAddress = "0x8c9e6c40d3402480ACE624730524fACC5482798c";
const erc20abi = ["function approve(address _spender, uint _value)"];

const PaymentRequest =
  "(address payable requester, uint256 amount, bytes32 zelleEmailHash, address payable executor)";

const abi = [
  "function createPaymentRequest(uint256 amount, bytes32 _zelleEmailHash) external returns (uint256)",
  `function getPaymentRequestsByIds(uint256[] memory requestIds) external view returns (${PaymentRequest}[] memory)`,
  "function reservePayment(uint256 requestId) payable",
  "function confirmPayment(uint256 requestId, uint256 transactionId)",
  "event PaymentReserved(uint256 requestId, address indexed reserver)",
];

const signer = Ethers.provider().getSigner();
const erc20 = new ethers.Contract(tokenAddress, erc20abi, signer);
const peer2peer = new ethers.Contract(CONTRACT, abi, signer);
const daiDecimal = 18;

const fetchOrders = () => {
  const ids = new Array(50).fill(0).map((_, i) => (i + 1).toString());
  console.log("ids", ids);
  peer2peer.getPaymentRequestsByIds(ids).then((data) => {
    data = data.map((t, index) => ({
      id: ids[index],
      requester: t[0],
      amount: ethers.utils.formatEther(t[1], daiDecimal),
      zelleHash: t[2],
      executor: t[3],
    }));

    State.update({
      orders: data.filter((t) => t.amount > 0),
    });
  });
};

//2

fetchOrders();

const handleCreate = () => {
  State.update({ loading: true });
  const emailHash = ethers.utils.sha256(ethers.utils.toUtf8Bytes(state.amount));
  const amount = ethers.utils.parseUnits(state.amount.toString(), daiDecimal);

  console.log(emailHash);

  erc20.approve(CONTRACT, amount).then((tx) => {
    tx.wait().then(() => {
      peer2peer.createPaymentRequest(amount, emailHash).then((tx) => {
        tx.wait().then((result) => {
          State.update({ loading: false });
          fetchOrders();
        });
      });
    });
  });
};

const handleBuy = (order) => {
  peer2peer
    .reservePayment(order.id, {
      value: ethers.utils.parseEther("0.01"),
    })
    .then((tx) => {
      tx.wait().then(() => {
        Storage.privateSet("activeOrder", order);
        State.update({ activeOrder: order });
      });
    });
};

if (state.activeOrder) {
  return (
    <Widget
      src="azbang.near/widget/peer2peerMakeOrder"
      props={{ order: state.activeOrder.id, public_token: props.public_token }}
    />
  );
}

console.log(state.orders);

//3

return (
  <Container>
    <div style={{ display: "flex", gap: 12 }}>
      {["0.001", "50", "100"].map((amount) => (
        <AmountButton
          className={amount == state.amount && "active"}
          onClick={() => State.update({ amount })}
        >
          {amount} DAI
        </AmountButton>
      ))}
    </div>

    <input
      value={state.email}
      placeholder="Enter your Zelle email"
      onChange={(e) => State.update({ email: e.target.value })}
    />

    <Info>
      Make sure that you indicate the email that is linked to your Zelle
      account, at this address validators verify the payment from the buyer
    </Info>

    <Button onClick={() => handleCreate()}>
      {state.loading ? (
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
      ) : (
        "Sell DAI"
      )}
    </Button>

    <div style={{ marginTop: 24 }}>
      <h4 style={{ marginBottom: 16 }}>Active orders</h4>
      {state.orders.map((order) => {
        const isRequester =
          order.requester.toLowerCase() === sender.toLowerCase();
        const isExecuter =
          order.executor.toLowerCase() === sender.toLowerCase();
        if (!isRequester && !isExecuter) return null;

        return (
          <Transaction>
            <div style={{ flex: 1 }}>
              <p>
                {isRequester
                  ? "Your order, you SELL"
                  : `You BUY from ${order.requester.slice(
                      0,
                      6
                    )}...${order.requester.slice(-6)}`}
              </p>
              <p>{order.amount} DAI</p>
            </div>
            <Button
              onClick={() => State.update({ activeOrder: order })}
              style={{ height: 48, width: 100 }}
            >
              Chat
            </Button>
          </Transaction>
        );
      })}
    </div>

    <div style={{ marginTop: 24 }}>
      <h4 style={{ marginBottom: 16 }}>Buy DAI</h4>
      {state.orders
        .filter(
          (t) =>
            t.executor === "0x0000000000000000000000000000000000000000" &&
            t.requester.toLowerCase() !== sender.toLowerCase()
        )
        .map((order) => (
          <Transaction>
            <div style={{ flex: 1 }}>
              <p>
                {order.requester.slice(0, 8)}...{order.requester.slice(-8)}
              </p>
              <p>{order.amount} DAI</p>
            </div>
            <Button
              onClick={() => handleBuy(order)}
              style={{ height: 48, width: 100 }}
            >
              Buy
            </Button>
          </Transaction>
        ))}
    </div>
  </Container>
);
