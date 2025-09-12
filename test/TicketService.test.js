import { describe, expect, jest } from '@jest/globals';
import TicketService from '../src/pairtest/TicketService';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException.js';
import { ErrorMessages, TicketPrices, TicketType } from '../src/pairtest/constants/index.js';
import TicketPaymentService from '../src/thirdparty/paymentgateway/TicketPaymentService.js'
import SeatReservationService from '../src/thirdparty/seatbooking/SeatReservationService.js'

jest.mock('../src/thirdparty/paymentgateway/TicketPaymentService.js')
jest.mock('../src/thirdparty/seatbooking/SeatReservationService.js')

describe('TicketService', () => {
    let service;

    beforeEach(() => {
        service = new TicketService();
        jest.spyOn(TicketPaymentService.prototype, 'makePayment').mockImplementation(() => {});
        jest.spyOn(SeatReservationService.prototype, 'reserveSeat').mockImplementation(() => {});

        jest.clearAllMocks();
    })

    describe('account validation', () => {
        it.each([
        ['abc'],
        [1.5],
        [null],
        [-1],
        ])('should throw an InvalidPurchaseException error when %s is given as the accountId', (input) => {
            const adultTicket = new TicketTypeRequest(TicketType.ADULT, 1);

            expect(() => service.purchaseTickets(input, adultTicket))
            .toThrow(new InvalidPurchaseException(ErrorMessages.INVALID_ACCOUNT_ID));

            expect(TicketPaymentService.prototype.makePayment).not.toHaveBeenCalled();
            expect(SeatReservationService.prototype.reserveSeat).not.toHaveBeenCalled();
        });
    });

    describe('ticket request validation', () => {
        it('should throw an InvalidPurchaseException error when the Ticket Requests ticket count is <= 0', () => {
            expect(() => service.purchaseTickets(1, new TicketTypeRequest(TicketType.ADULT, -1)))
            .toThrow(new InvalidPurchaseException(ErrorMessages.TICKET_TYPE_MISSING_TICKETS));

            expect(() => service.purchaseTickets(1, new TicketTypeRequest(TicketType.ADULT, 0)))
            .toThrow(new InvalidPurchaseException(ErrorMessages.TICKET_TYPE_MISSING_TICKETS));

            expect(() => service.purchaseTickets(1, new TicketTypeRequest(TicketType.ADULT, 1)))
            .not.toThrow(new InvalidPurchaseException(ErrorMessages.TICKET_TYPE_MISSING_TICKETS));
        });

        it('should throw InvalidPurchaseException if a TicketTypeRequest has an unknown type', () => {
            const unknownTicketType = 'UNKNOWN_TYPE';
            const fakeRequest = {
                getTicketType: () => unknownTicketType,
                getNoOfTickets: () => 1,
            };

            expect(() => service.purchaseTickets(1, fakeRequest))
                .toThrow(new InvalidPurchaseException(`${ErrorMessages.UNKNOWN_TICKET_TYPE}: ${unknownTicketType}`));
            
            expect(TicketPaymentService.prototype.makePayment).not.toHaveBeenCalled();
            expect(SeatReservationService.prototype.reserveSeat).not.toHaveBeenCalled();
        });
    });

    describe('business rules validation', () => {
        it('should throw an InvalidPurchaseException error when more than 25 tickets are purchased', () => {
            expect(() => service.purchaseTickets(1, new TicketTypeRequest(TicketType.ADULT, 26)))
            .toThrow(new InvalidPurchaseException(ErrorMessages.TOO_MANY_TICKETS));

            expect(TicketPaymentService.prototype.makePayment).not.toHaveBeenCalled();
            expect(SeatReservationService.prototype.reserveSeat).not.toHaveBeenCalled();
        });

        it('should throw an InvalidPurchaseException error when there are no adult tickets', () => {
            expect(() => service.purchaseTickets(1, new TicketTypeRequest(TicketType.CHILD, 5)))
            .toThrow(new InvalidPurchaseException(ErrorMessages.NO_ADULT_TICKETS));

            expect(TicketPaymentService.prototype.makePayment).not.toHaveBeenCalled();
            expect(SeatReservationService.prototype.reserveSeat).not.toHaveBeenCalled();
        });
        
        it('should throw an InvalidPurchaseException error when there are more infants than adults', () => {
            const requests = [new TicketTypeRequest(TicketType.ADULT, 10), new TicketTypeRequest(TicketType.INFANT, 15)]
            
            expect(() => service.purchaseTickets(1, ...requests))
            .toThrow(new InvalidPurchaseException(ErrorMessages.MORE_INFANTS_THAN_ADULTS));

            expect(TicketPaymentService.prototype.makePayment).not.toHaveBeenCalled();
            expect(SeatReservationService.prototype.reserveSeat).not.toHaveBeenCalled();
        });
    });

    describe('successful purchase', () => {
        it('should make payment and reserve seats when successfully validating all the business rules', () => {
            let adultCount = 10, infantCount = 5, childCount = 5;
            const requests = [new TicketTypeRequest(TicketType.ADULT, adultCount), new TicketTypeRequest(TicketType.INFANT, infantCount), new TicketTypeRequest(TicketType.CHILD, childCount)]
            const totalCost = adultCount * TicketPrices[TicketType.ADULT] + childCount * TicketPrices[TicketType.CHILD]
            
            expect(() => service.purchaseTickets(1, ...requests))
            .not.toThrow(InvalidPurchaseException);

            expect(TicketPaymentService.prototype.makePayment).toHaveBeenCalledWith(1, totalCost);
            expect(SeatReservationService.prototype.reserveSeat).toHaveBeenCalledWith(1, (adultCount + childCount));
        });
    });
})