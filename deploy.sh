#!/bin/bash

rm -rf dist
npm run build --prod
aws s3 sync dist s3://ambpayment2 --delete