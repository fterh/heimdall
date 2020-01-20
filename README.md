# heimdall

[![Build Status](https://travis-ci.com/fterh/heimdall.svg?branch=master)](https://travis-ci.com/fterh/heimdall)
[![Maintainability](https://api.codeclimate.com/v1/badges/8400b327ea3d328c9f5e/maintainability)](https://codeclimate.com/github/fterh/heimdall/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/8400b327ea3d328c9f5e/test_coverage)](https://codeclimate.com/github/fterh/heimdall/test_coverage)

## Setup

1. Populate required environment variables in `.env.sample`, and rename to `.env`.
   It is important that `EMAIL` matches your personal email exactly.

## Commands

To interact with the service, send a single email to one of the following email addresses.

### Generate an alias

Email `generate@yourverifieddomain.com` with the source as the subject. You will receive the generated alias as a reply.

### List aliases

Email `list@yourverifieddomain.com`. You will receive a list of all aliases as a reply.

Dev note: This reads up to a maximum of 1MB of data (due to AWS's limitations).

### Remove an alias

Email `remove@yourverifieddomain.com` with the alias as the title (case-sensitive). You will receive the operation outcome (success/failure) as a reply.

### Update an alias

Not supported yet.

## Known Limitations

1. As a MVP, this does not support replying to more than 1 email address.
   E.g. if A sends an email to alias1@domain1.com which gets forwarded to you@domain2.com while CC-ing
   B and C, replying to that email will only send the response to A (but not B and C).

2. Currently, attachments are not supported.
