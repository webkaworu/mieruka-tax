import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

def get_supabase_client() -> Client:
    """
    Supabaseクライアントを初期化して返します。
    2025年以降の新しい不透明APIキー形式 (sb_secret_...) をサポートしています。
    """
    url: str = os.environ.get("SUPABASE_URL")
    # Python SDK v2.30.1+ では新しい sb_secret_ 形式が推奨されています
    key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.")
        
    return create_client(url, key)
