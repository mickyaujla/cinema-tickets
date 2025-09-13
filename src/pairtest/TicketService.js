import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import { ErrorMessages, TicketPrices, TicketType } from './constants/index.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#validateAccountId(accountId)

    const summary = this.#validateAndSummariseTicketRequests(ticketTypeRequests)
    
    this.#validateBusinessRules(summary)

    const paymentService = new TicketPaymentService();
    paymentService.makePayment(accountId, summary.totalCost);

    const reservationService = new SeatReservationService();
    reservationService.reserveSeat(accountId, summary.totalNumberOfSeats);
  }

  #validateAccountId(accountId) {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException(ErrorMessages.INVALID_ACCOUNT_ID);
    }
  }

  #validateAndSummariseTicketRequests(requests) {
    const summary = {
      adultCount: 0,
      childCount: 0,
      infantCount: 0,
      totalTicketCount: 0,
      totalCost: 0,
      totalNumberOfSeats: 0
    };

    for (const req of requests) {
      const type = req.getTicketType();
      const ticketCount = req.getNoOfTickets();

      if (ticketCount <= 0) {
        throw new InvalidPurchaseException(ErrorMessages.TICKET_TYPE_MISSING_TICKETS)
      }

      switch (type) {
        case TicketType.ADULT:
          summary.adultCount += ticketCount;
          summary.totalTicketCount += ticketCount;
          summary.totalCost += TicketPrices[TicketType.ADULT] * ticketCount;
          summary.totalNumberOfSeats += ticketCount;
          break;
        case TicketType.CHILD:
          summary.childCount += ticketCount;
          summary.totalTicketCount += ticketCount;
          summary.totalCost += TicketPrices[TicketType.CHILD] * ticketCount;
          summary.totalNumberOfSeats += ticketCount;
          break;
        case TicketType.INFANT:
          summary.infantCount += ticketCount;
          break;
        default:
          throw new InvalidPurchaseException(`${ErrorMessages.UNKNOWN_TICKET_TYPE}: ${type}`);
      }
    }

    return summary;
  }

  #validateBusinessRules(summary) {
    const { adultCount, childCount, infantCount, totalTicketCount, totalCost, totalNumberOfSeats, } = summary;

    if(totalTicketCount > 25) {
      throw new InvalidPurchaseException(ErrorMessages.TOO_MANY_TICKETS);
    }

    if (adultCount <= 0) {
      throw new InvalidPurchaseException(ErrorMessages.NO_ADULT_TICKETS);
    }

    if (infantCount > adultCount) {
      throw new InvalidPurchaseException(ErrorMessages.MORE_INFANTS_THAN_ADULTS);
    }
  }
}
