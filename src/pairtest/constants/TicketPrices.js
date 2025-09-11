import TicketType from "./TicketType";

const TicketPrices = Object.freeze({
    [TicketType.ADULT]: 25,
    [TicketType.CHILD]: 15,
    [TicketType.INFANT]: 0
});

export default TicketPrices;