This folder contains all assets for open source friday livestreams.

Ideal flow for actions:

- send Open Source Friday Invite Template and booking link to potential guests
- they complete the form with the date selected and submit the issue
- the issue is automatically assigned to LadyKerr and Andrea with the label `pending`
- the issue triggers a workflow that creates a comment reminding the guest to book a time slot if t hey haven't already
- we go in and add the `scheduled` label to the issue to confirm booking
- At the approved label, the workflow triggers and creates a new comment in the issue reminding the hosts to create the event + assets
- At the approved label the workflows triggers and creates a new comment in the issue seniding the guest instructions on how to join the event + prepare for it

Not done yet:

- day before the event the workflow sends a reminder to guest in the issue
- post event the workflow sends a thank you message to the guest in the issue
- post event the host closes the issue
