# heimdall

[![Build Status](https://travis-ci.com/fterh/heimdall.svg?branch=master)](https://travis-ci.com/fterh/heimdall)
[![Maintainability](https://api.codeclimate.com/v1/badges/8400b327ea3d328c9f5e/maintainability)](https://codeclimate.com/github/fterh/heimdall/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/8400b327ea3d328c9f5e/test_coverage)](https://codeclimate.com/github/fterh/heimdall/test_coverage)

Heimdall is a self-hosted email alias management service.
I built this to fight spam and also identify companies that disclose my email address to 3rd parties.
As a self-hosted/managed solution, you have complete control over your data.
With 3rd party email forwarding services, you are forced to trust a company with your emails.

This has also been a really fun project for me to learn more about AWS and the Serverless framework.

## Setup

**Pre-requisites:** You need to own a domain and have an AWS account. For reasonable use cases, you should not exceed AWS's free tier.

1. Populate required environment variables in `.env.sample`, and rename to `.env`.
   It is important that `EMAIL` matches your personal email exactly.
2. `yarn global add serverless`
3. Set up Serverless, then `serverless deploy`.
4. Add and verify your domain in AWS Simple Email Service (SES).
5. Add a receipt rule in SES to trigger your S3 bucket (created in step 3).

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
