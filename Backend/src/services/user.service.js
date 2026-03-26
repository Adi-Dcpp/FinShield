const updateUserStats = async(user, transaction) => {
    const {amount , deviceId} = transaction;
    const newTxnCnt = user.txnCount + 1;
    const newAvg = (user.avgTxnAmount * user.txnCount + amount) / newTxnCnt;

    if(!user.usualDevices.includes(deviceId)){
        user.usualDevices.push(deviceId);
    }

    user.avgTxnAmount = newAvg;
    user.txnCount = newTxnCnt;

    await user.save()

    return user;
}

export {
    updateUserStats
}