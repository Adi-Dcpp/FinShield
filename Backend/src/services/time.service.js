const getHourFromTime = (timeStamp) => {
    const date = new Date(timeStamp);
    return date.getHours();
}

export {getHourFromTime};