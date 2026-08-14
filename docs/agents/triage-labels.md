# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

Because issues live as local markdown files, the "label" is the value written on the `Status:` line near the top of each issue file.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

Two further labels have no counterpart in the skills' five roles, because they describe work
that has already left triage:

| Label in our tracker | Meaning                                                  |
| -------------------- | -------------------------------------------------------- |
| `claimed`            | An agent or human has started; not yet finished          |
| `resolved`           | Built and verified. Carries the date, and the commit      |

A `resolved` line is expected to say *where* — the date and the commit or branch — and to
record any criterion that shipped differently from the ticket, so the ticket stays readable as
the account of what happened. Closing a ticket also means ticking its acceptance criteria from
`- [ ]` to `- [x]`; a `resolved` status over unticked criteria is the signature of a status
line written without the work being checked.

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.
