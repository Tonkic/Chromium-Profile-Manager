#!/usr/bin/env python3
# -*- coding: UTF-8 -*-

"""Classify Chromium source files for generated pruning and domain substitution lists."""

import sys
from pathlib import Path, PurePosixPath

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'utils'))
from _common import get_logger
from domain_substitution import TREE_ENCODINGS
from prune_binaries import CONTINGENT_PATHS

sys.path.pop(0)

# pylint: disable=line-too-long

# NOTE: Include patterns have precedence over exclude patterns
# pathlib.Path.match() paths to include in binary pruning
PRUNING_INCLUDE_PATTERNS = [
    'components/domain_reliability/baked_in_configs/*',
    # Removals for patches/core/ungoogled-chromium/remove-unused-preferences-fields.patch
    'components/safe_browsing/core/common/safe_browsing_prefs.cc',
    'components/safe_browsing/core/common/safe_browsing_prefs.h',
    'components/signin/public/base/signin_pref_names.cc',
    'components/signin/public/base/signin_pref_names.h',
]

# pathlib.Path.match() paths to exclude from binary pruning
PRUNING_EXCLUDE_PATTERNS = [
    'chrome/common/win/eventlog_messages.mc', # TODO: False positive textfile
    # Exclusions for DOM distiller (contains model data only)
    'components/dom_distiller/core/data/distillable_page_model_new.bin',
    'components/dom_distiller/core/data/long_page_model.bin',
    # Exclusions for GeoLanguage data
    # Details: https://docs.google.com/document/d/18WqVHz5F9vaUiE32E8Ge6QHmku2QSJKvlqB9JjnIM-g/edit
    # Introduced with: https://chromium.googlesource.com/chromium/src/+/6647da61
    'components/language/content/browser/ulp_language_code_locator/geolanguage-data_rank0.bin',
    'components/language/content/browser/ulp_language_code_locator/geolanguage-data_rank1.bin',
    'components/language/content/browser/ulp_language_code_locator/geolanguage-data_rank2.bin',
    # Exclusion for required prebuilt object for Windows arm64 builds
    'third_party/crashpad/crashpad/util/misc/capture_context_win_arm64.obj',
    'third_party/icu/common/icudtl.dat', # Exclusion for ICU data
    # Exclusion for Android
    'build/android/chromium-debug.keystore',
    'third_party/icu/android/icudtl.dat',
    'third_party/icu/common/icudtb.dat',
    # Exclusion for rollup v4.0+
    'third_party/devtools-frontend/src/node_modules/@rollup/wasm-node/dist/wasm-node/bindings_wasm_bg.wasm',
    'third_party/node/node_modules/@rollup/wasm-node/dist/wasm-node/bindings_wasm_bg.wasm',
    # Exclusion for performance tracing
    'third_party/perfetto/src/trace_processor/importers/proto/atoms.descriptor',
    # Exclusion for zoneinfo64
    'third_party/rust/chromium_crates_io/vendor/zoneinfo64-v0_2/src/data/zoneinfo64.res',
    # Exclusions for safe file extensions
    '*.avif',
    '*.ttf',
    '*.png',
    '*.jpg',
    '*.webp',
    '*.gif',
    '*.ico',
    '*.mp3',
    '*.wav',
    '*.flac',
    '*.car',
    '*.icns',
    '*.woff',
    '*.woff2',
    '*makefile',
    '*.profdata',
    '*.xcf',
    '*.cur',
    '*.pdf',
    '*.ai',
    '*.h',
    '*.c',
    '*.cpp',
    '*.cc',
    '*.mk',
    '*.bmp',
    '*.py',
    '*.xml',
    '*.html',
    '*.js',
    '*.json',
    '*.txt',
    '*.xtb'
]

# NOTE: Domain substitution path prefix exclusion has precedence over inclusion patterns
# Paths to exclude by prefixes of the POSIX representation for domain substitution
DOMAIN_EXCLUDE_PREFIXES = [
    'components/test/',
    'net/http/transport_security_state_static.json',
    'net/http/transport_security_state_static_pins.json',
    # Exclusions for Visual Studio Project generation with GN (PR #445)
    'tools/gn/',
    # Exclusions for files covered with other patches/unnecessary
    'third_party/search_engines_data/resources/definitions/prepopulated_engines.json',
    'third_party/blink/renderer/core/dom/document.cc',
    # Exclusion to allow download of sysroots
    'build/linux/sysroot_scripts/sysroots.json',
    # Licenses and credits
    'tools/licenses/licenses.py',
]

# pylint: enable=line-too-long

# pathlib.Path.match() patterns to include in domain substitution
DOMAIN_INCLUDE_PATTERNS = [
    '*.h', '*.hh', '*.hpp', '*.hxx', '*.cc', '*.cpp', '*.cxx', '*.c', '*.h', '*.json', '*.js',
    '*.html', '*.htm', '*.css', '*.py*', '*.grd*', '*.sql', '*.idl', '*.mk', '*.gyp*', 'makefile',
    '*.ts', '*.txt', '*.xml', '*.mm', '*.jinja*', '*.gn', '*.gni'
]

# Binary-detection constant
_TEXTCHARS = bytearray({7, 8, 9, 10, 12, 13, 27} | set(range(0x20, 0x100)) - {0x7f})


class UnusedPatterns: #pylint: disable=too-few-public-methods
    """Tracks unused prefixes and patterns"""

    _all_names = ('pruning_include_patterns', 'pruning_exclude_patterns', 'domain_include_patterns',
                  'domain_exclude_prefixes')

    def __init__(self):
        # Initialize all tracked patterns and prefixes in sets
        # Users will discard elements that are used
        for name in self._all_names:
            setattr(self, name, set(globals()[name.upper()]))

    def log_unused(self, error=True):
        """
        Logs unused patterns and prefixes

        Returns True if there are unused patterns or prefixes; False otherwise
        """
        have_unused = False
        log = get_logger().error if error else get_logger().info
        for name in self._all_names:
            current_set = getattr(self, name, None)
            if current_set:
                log('Unused from %s: %s', name.upper(), current_set)
                have_unused = True
        return have_unused


def _is_binary(bytes_data):
    """
    Returns True if the data seems to be binary data (i.e. not human readable); False otherwise
    """
    # From: https://stackoverflow.com/a/7392391
    return bool(bytes_data.translate(None, _TEXTCHARS))


def should_prune(path, relative_path, used_pep_set, used_pip_set):
    """
    Returns True if a path should be pruned from the source tree; False otherwise

    path is the pathlib.Path to the file from the current working directory.
    relative_path is the pathlib.Path to the file from the source tree
    used_pep_set is a list of PRUNING_EXCLUDE_PATTERNS that have been matched
    used_pip_set is a list of PRUNING_INCLUDE_PATTERNS that have been matched
    """
    # Match against include patterns
    for pattern in filter(relative_path.match, PRUNING_INCLUDE_PATTERNS):
        used_pip_set.add(pattern)
        return True

    # Match against exclude patterns
    for pattern in filter(Path(str(relative_path).lower()).match, PRUNING_EXCLUDE_PATTERNS):
        used_pep_set.add(pattern)
        return False

    # Do binary data detection
    with path.open('rb') as file_obj:
        if _is_binary(file_obj.read()):
            return True

    # Passed all filtering; do not prune
    return False


def _check_regex_match(file_path, search_regex):
    """
    Returns True if a regex pattern matches a file; False otherwise

    file_path is a pathlib.Path to the file to test
    search_regex is a compiled regex object to search for domain names
    """
    with file_path.open("rb") as file_obj:
        file_bytes = file_obj.read()
        content = None
        for encoding in TREE_ENCODINGS:
            try:
                content = file_bytes.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        if not search_regex.search(content) is None:
            return True
    return False


def should_domain_substitute(path, relative_path, search_regex, used_dep_set, used_dip_set):
    """
    Returns True if a path should be domain substituted in the source tree; False otherwise

    path is the pathlib.Path to the file from the current working directory.
    relative_path is the pathlib.Path to the file from the source tree.
    used_dep_set is a list of DOMAIN_EXCLUDE_PREFIXES that have been matched
    used_dip_set is a list of DOMAIN_INCLUDE_PATTERNS that have been matched
    """
    relative_path_posix = relative_path.as_posix().lower()
    for include_pattern in DOMAIN_INCLUDE_PATTERNS:
        if PurePosixPath(relative_path_posix).match(include_pattern):
            used_dip_set.add(include_pattern)
            for exclude_prefix in DOMAIN_EXCLUDE_PREFIXES:
                if relative_path_posix.startswith(exclude_prefix):
                    used_dep_set.add(exclude_prefix)
                    return False
            # Skip LICENSE.* files so that they remain untouched.
            for license_path in ['license', 'license.txt', 'license.html']:
                if relative_path_posix.endswith('/' + license_path):
                    return False
            return _check_regex_match(path, search_regex)
    return False


def compute_lists_proc(path, source_tree, search_regex):
    """
    Adds the path to appropriate lists to be used by compute_lists.

    path is the pathlib.Path to the file from the current working directory.
    source_tree is a pathlib.Path to the source tree
    search_regex is a compiled regex object to search for domain names
    """
    used_pep_set = set() # PRUNING_EXCLUDE_PATTERNS
    used_pip_set = set() # PRUNING_INCLUDE_PATTERNS
    used_dep_set = set() # DOMAIN_EXCLUDE_PREFIXES
    used_dip_set = set() # DOMAIN_INCLUDE_PATTERNS
    pruning_set = set()
    domain_substitution_set = set()
    symlink_set = set()
    if path.is_file():
        relative_path = path.relative_to(source_tree)
        if not any(str(relative_path.as_posix()).startswith(cpath) for cpath in CONTINGENT_PATHS):
            if path.is_symlink():
                try:
                    resolved_relative_posix = path.resolve().relative_to(source_tree).as_posix()
                    symlink_set.add((resolved_relative_posix, relative_path.as_posix()))
                except ValueError:
                    # Symlink leads out of the source tree
                    pass
            elif not any(skip in ('.git', '__pycache__', 'uc_staging') for skip in path.parts):
                try:
                    if should_prune(path, relative_path, used_pep_set, used_pip_set):
                        pruning_set.add(relative_path.as_posix())
                    elif should_domain_substitute(path, relative_path, search_regex, used_dep_set,
                                                  used_dip_set):
                        domain_substitution_set.add(relative_path.as_posix())
                except: #pylint: disable=bare-except
                    get_logger().exception('Unhandled exception while processing %s', relative_path)
    return (used_pep_set, used_pip_set, used_dep_set, used_dip_set, pruning_set,
            domain_substitution_set, symlink_set)
