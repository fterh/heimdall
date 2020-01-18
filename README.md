# heimdall

## Setup

1. Define environment variables `DOMAIN=yourverifieddomain.com` and `EMAIL=yourpersonalemail@domain.com` in `.env.sample`, and rename to `.env`.

## Known Limitations

1. As a MVP, this does not support replying to more than 1 email address.
   E.g. if A sends an email to alias1@domain1.com which gets forwarded to you@domain2.com while CC-ing
   B and C, replying to that email will only send the response to A (but not B and C).

2. Currently, attachments are not supported.
