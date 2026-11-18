import asyncio
import os
from typing import BinaryIO

import boto3
from botocore.config import Config

def _client():
    return boto3.client(
        "s3",
        endpoint_url=os.environ["R2_ENDPOINT"],
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        region_name=os.getenv("R2_REGION", "auto"),
        config=Config(signature_version="s3v4"),
    )

def _bucket() -> str:
    return os.environ["R2_BUCKET"]

async def upload_object(
        file_object: BinaryIO,
        object_key: str,
        content_type: str | None,
) -> None:
    extra_args = {}
    if content_type:
        extra_args["ContentType"]=content_type
    await asyncio.to_thread(
        _client().upload_fileobj,
        file_object,
        _bucket(),
        object_key,
        ExtraArgs=extra_args
    )
async def delete_object(object_key: str) -> None:
    await asyncio.to_thread(
        _client().delete_object,
        Bucket=_bucket(),
        Key=object_key,
    )

async def create_download_url(
    object_key: str,
    expires_in: int = 300,
) -> str:
    return await asyncio.to_thread(
        _client().generate_presigned_url,
        "get_object",
        Params={
            "Bucket": _bucket(),
            "Key": object_key,
        },
        ExpiresIn=expires_in,
    )