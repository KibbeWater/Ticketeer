# General idea

Ticketeer is a discord based bot that is used to manage large amount of tickets with high efficiency for larger teams.

## Teams

A server can have different "teams" a team is essentially a specialised group of people who can help with a particular problem

Let's use payment inqueries as an example, a normal support member helping with other service problems such as helping setting up features etc can not help with payment issues as they might not be as trusted and needs a higher "clearance" to look up such information

A team should **team members** and a **team supervisor**.

Team supervisors are members that are ranked higher, maybe a good performing support member, that are specialized in an area and are approved to supervise all other tickets and can be ready to reopen/take over a ticket to provide further support and/or respond to questions the previous support member could not answer

## Supervisors

Supervisors have access to view but not talk in tickets, tickets are locked to only 1 support member, support members have the option to escalate a ticket to supervisors and also have the option to move a ticket to a different team

There will also be a **Global Supervisor**, these may be considered an Administrator, these people have access to essentially any information and can help in any inquery, should be last resort of an escalation

## Algorithm

Ticketeer will be using a advanced algorithm to determine the best support member for the job on a bunch of different factors.

Such factors may include: current status, average feedback, average recent feedback, response time, currently claimed tickets, total tickets (previous experience).

## Alternatives to picking support

The algorithm will be a premium feature, locked behind a cheap paywall, so what are some good alternatives to this method?

* Let team members pick and choose in a private channel
* Let supervisors assign support members
