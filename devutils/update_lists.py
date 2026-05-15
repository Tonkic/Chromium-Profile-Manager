#!/usr/bin/env python3

# Copyright (c) 2019 The ungoogled-chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.
"""
Update binary pruning and domain substitution lists automatically.

It will download and unpack into the source tree as necessary.
No binary pruning or domain substitution will be applied to the source tree after
the process has finished.
"""

import argparse
import os
import sys

from itertools import repeat
from multiprocessing import Pool
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'utils'))
from _common import get_logger
from domain_substitution import DomainRegexList

sys.path.pop(0)
import list_classification as classifier

# Encoding for output files
_ENCODING = 'UTF-8'


def _dir_empty(path):
    """
    Returns True if the directory is empty; False otherwise

    path is a pathlib.Path or string to a directory to test.
    """
    try:
        next(os.scandir(str(path)))
    except StopIteration:
        return True
    return False


def compute_lists(source_tree, search_regex, processes): # pylint: disable=too-many-locals
    """
    Compute the binary pruning and domain substitution lists of the source tree.
    Returns a tuple of three items in the following order:
    1. The sorted binary pruning list
    2. The sorted domain substitution list
    3. An UnusedPatterns object

    source_tree is a pathlib.Path to the source tree
    search_regex is a compiled regex object to search for domain names
    processes is the maximum number of worker processes to create
    """
    pruning_set = set()
    domain_substitution_set = set()
    symlink_set = set() # POSIX resolved path -> set of POSIX symlink paths
    source_tree = source_tree.resolve()
    unused_patterns = classifier.UnusedPatterns()

    # Launch multiple processes iterating over the source tree
    with Pool(processes) as procpool:
        returned_data = procpool.starmap(
            classifier.compute_lists_proc,
            zip(source_tree.rglob('*'), repeat(source_tree), repeat(search_regex)))

    # Handle the returned data
    for (used_pep_set, used_pip_set, used_dep_set, used_dip_set, returned_pruning_set,
         returned_domain_sub_set, returned_symlink_set) in returned_data:
        # pragma pylint: disable=no-member
        unused_patterns.pruning_exclude_patterns.difference_update(used_pep_set)
        unused_patterns.pruning_include_patterns.difference_update(used_pip_set)
        unused_patterns.domain_exclude_prefixes.difference_update(used_dep_set)
        unused_patterns.domain_include_patterns.difference_update(used_dip_set)
        # pragma pylint: enable=no-member
        pruning_set.update(returned_pruning_set)
        domain_substitution_set.update(returned_domain_sub_set)
        symlink_set.update(returned_symlink_set)

    # Prune symlinks for pruned files
    for (resolved, symlink) in symlink_set:
        if resolved in pruning_set:
            pruning_set.add(symlink)

    return sorted(pruning_set), sorted(domain_substitution_set), unused_patterns


def main(args_list=None):
    """CLI entrypoint"""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pruning',
                        metavar='PATH',
                        type=Path,
                        default='pruning.list',
                        help='The path to store pruning.list. Default: %(default)s')
    parser.add_argument('--domain-substitution',
                        metavar='PATH',
                        type=Path,
                        default='domain_substitution.list',
                        help='The path to store domain_substitution.list. Default: %(default)s')
    parser.add_argument('--domain-regex',
                        metavar='PATH',
                        type=Path,
                        default='domain_regex.list',
                        help='The path to domain_regex.list. Default: %(default)s')
    parser.add_argument('-t',
                        '--tree',
                        metavar='PATH',
                        type=Path,
                        required=True,
                        help='The path to the source tree to use.')
    parser.add_argument(
        '--processes',
        metavar='NUM',
        type=int,
        default=None,
        help=
        'The maximum number of worker processes to create. Defaults to the number of system CPUs.')
    parser.add_argument('--domain-exclude-prefix',
                        metavar='PREFIX',
                        type=str,
                        action='append',
                        help='Additional exclusion for domain_substitution.list.')
    parser.add_argument('--no-error-unused',
                        action='store_false',
                        dest='error_unused',
                        help='Do not treat unused patterns/prefixes as an error.')
    args = parser.parse_args(args_list)
    if args.domain_exclude_prefix is not None:
        classifier.DOMAIN_EXCLUDE_PREFIXES.extend(args.domain_exclude_prefix)
    if args.tree.exists() and not _dir_empty(args.tree):
        get_logger().info('Using existing source tree at %s', args.tree)
    else:
        get_logger().error('No source tree found. Aborting.')
        sys.exit(1)
    get_logger().info('Computing lists...')
    pruning_set, domain_substitution_set, unused_patterns = compute_lists(
        args.tree,
        DomainRegexList(args.domain_regex).search_regex, args.processes)
    with args.pruning.open('w', encoding=_ENCODING) as file_obj:
        file_obj.writelines(f'{line}\n' for line in pruning_set)
    with args.domain_substitution.open('w', encoding=_ENCODING) as file_obj:
        file_obj.writelines(f'{line}\n' for line in domain_substitution_set)
    if unused_patterns.log_unused(args.error_unused) and args.error_unused:
        get_logger().error('Please update or remove unused patterns and/or prefixes. '
                           'The lists have still been updated with the remaining valid entries.')
        sys.exit(1)


if __name__ == "__main__":
    main()
