# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['main_api.py'],
    pathex=['C:\\Users\\mertk\\Desktop\\OmnIDEv1.1'],
    binaries=[],
    datas=[
        # Include all necessary directories and files
        ('controllers', 'controllers'),
        ('services', 'services'),
        ('models', 'models'),
        ('database', 'database'),
        ('views', 'views'),
        ('example_files', 'example_files'),
        ('defaultExtractLocation', 'defaultExtractLocation'),
        ('.env', '.'),
    ],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'uvicorn.lifespan.off',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.protocols.websockets.wsproto_implementations',
        'uvicorn.protocols.websockets.websockets_impl',
        'fastapi.applications',
        'sqlalchemy.orm',
        'sqlalchemy.ext.declarative',
        'pydantic',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='OmnIDE',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    uac_admin=True  # Add this parameter to request admin privileges
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='OmnIDE',
)