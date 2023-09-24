const emailRegex = /\S+@\S+\.\S+/;

const checkAndSignResponse = async () => {
    const url = "https://sandbox.plaid.com/transactions/get";
    const bdata = {
        access_token, start_date, end_date
    };
    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "PLAID-CLIENT-ID": client_id,
            "PLAID-SECRET": secret,
        },
        body: JSON.stringify(bdata)
    }).then((response) => response.json());


    const firstEmailMatch = resp.transactions[tr_num].name.match(emailRegex);
    if (firstEmailMatch) {
        name = firstEmailMatch[0]
    }
    else {
        name = resp.transactions[tr_num].name
    }

    const trx = {
        transaction_id: resp.transactions[tr_num].transaction_id,
        amount: resp.transactions[tr_num].amount,
        name: name,
        timestamp: Date.parse(resp.transactions[tr_num].datetime) ||  Date.parse(resp.transactions[tr_num].date)
    };

    const transactionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(trx.transaction_id));

    const encodedTrx = ethers.utils.defaultAbiCoder.encode(
        ['bytes32', 'int256', 'string', 'int256'],
        [
            transactionHash,
            ethers.utils.parseUnits(trx.amount.toString(), 2),
            trx.name,
            trx.timestamp,
        ]
    );

    const toSign = ethers.utils.keccak256(encodedTrx);
    await LitActions.signEcdsa({ toSign, publicKey, sigName });

    const result = {
        data: encodedTrx,
        transactionId: transactionHash,
    }

    LitActions.setResponse({ response: JSON.stringify(result) });
};

checkAndSignResponse();
