const ErrorMessages = Object.freeze({
    INVALID_ACCOUNT_ID: 'Account ID must be an integer greater than zero',
    TOO_MANY_TICKETS: 'Cannot purchase more than 25 tickets',
    TICKET_TYPE_MISSING_TICKETS: 'Each TicketTypeRequest must have tickets',
    UNKNOWN_TICKET_TYPE: 'Unknown ticket type',
    MORE_INFANTS_THAN_ADULTS: 'Number of infants exceed the number of adults',
    NO_ADULT_TICKETS: 'There needs to be at least 1 adult'
});

export default ErrorMessages;