FROM rabbitmq:3.13-management-alpine

# Download delayed message plugin (VERSION MUST MATCH RABBITMQ VERSION)
ADD https://github.com/rabbitmq/rabbitmq-delayed-message-exchange/releases/download/v3.13.0/rabbitmq_delayed_message_exchange-3.13.0.ez \
    /plugins/rabbitmq_delayed_message_exchange.ez

# Enable plugins
RUN rabbitmq-plugins enable --offline \
    rabbitmq_delayed_message_exchange \
    rabbitmq_shovel \
    rabbitmq_shovel_management
