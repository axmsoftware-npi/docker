FROM jboss/wildfly
RUN curl -o /opt/jboss/wildfly/standalone/deployments/business-central.war  https://download.jboss.org/drools/release/7.30.0.Final/business-central-7.30.0.Final-wildfly14.war &&\
    curl -o /opt/jboss/wildfly/standalone/deployments/kie-server.war https://download.jboss.org/drools/release/7.30.0.Final/kie-server-distribution-7.30.0.Final.zip &&\
    /opt/jboss/wildfly/bin/add-user.sh planner Planner123_ --silent
