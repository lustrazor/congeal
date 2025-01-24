#!/bin/bash

# DEPRECATED: This script is no longer needed as we've moved to Nodemailer
# for email handling instead of system-level postfix.
# Keep this file for reference until fully removed in next major version.

echo "This script is deprecated and will be removed in a future version."
echo "Email handling is now done through Nodemailer."

# Execute the main container command
exec "$@"
