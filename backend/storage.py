import asyncio
import os
from collections.abc import Iterator
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

async def upload_object(file_object: BinaryIO, object_key: str, content_type: str | None) -> None:
    extra_args = {"ContentType": content_type} if content_type else {}
    await asyncio.to_thread(
        _client().upload_fileobj,
        file_object,
        os.environ["R2_BUCKET"],
        object_key,
        ExtraArgs=extra_args,
    )

async def delete_object(object_key: str) -> None:
    await asyncio.to_thread(_client().delete_object, Bucket=os.environ["R2_BUCKET"], Key=object_key)

async def get_object_stream(object_key: str) -> tuple[Iterator[bytes], str | None, int | None]:
    obj = await asyncio.to_thread(_client().get_object, Bucket=os.environ["R2_BUCKET"], Key=object_key)
    body = obj["Body"]
    def iter_chunks():
        try:
            yield from body.iter_chunks(chunk_size=65536)
        finally:
            body.close()
    return iter_chunks(), obj.get("ContentType"), obj.get("ContentLength")
