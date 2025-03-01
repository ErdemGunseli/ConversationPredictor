import os
import traceback

import boto3
from botocore.exceptions import ClientError

from exceptions import APIRequestException


AWS_REGION = os.getenv("AWS_REGION")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")


def send_email(recipient: str, subject: str, body: str) -> None:
    charset = "UTF-8"

    client = boto3.client("ses")
    try:
        response = client.send_email(
            Destination={
                "ToAddresses": [recipient],
            },
            Message={
                "Body": {
                    "Text": {
                        "Charset": charset,
                        "Data": body,
                    },
                },
                "Subject": {
                    "Charset": charset,
                    "Data": subject,
                },
            },
            Source=SENDER_EMAIL
        )
    except ClientError:
        traceback.print_exc()
        raise APIRequestException