FROM buildpack-deps:stretch-curl

LABEL maintainer="jmatsu.drm@gmail.com"

LABEL "com.github.actions.name"="This action uploads an application file to DeployGate"
LABEL "com.github.actions.description"="An action to upload an application file to DeployGate"
LABEL "com.github.actions.icon"="thumbs-up"
LABEL "com.github.actions.color"="gray-dark"

RUn curl -sSL "https://raw.githubusercontent.com/jmatsu/github-actions-toolkit/f23fcb2f07c2cc309e207e7ccc2a9731e01b4b81/toolkit.sh" -o /toolkit.sh

RUN curl -sSL "https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64" -o /jq
RUN chmod +x /jq
RUN ln -s /jq /usr/bin/jq

COPY VERSION /VERSION

COPY entry-point.sh /entry-point.sh
RUN chmod +x /entry-point.sh

ENTRYPOINT ["/entry-point.sh"]