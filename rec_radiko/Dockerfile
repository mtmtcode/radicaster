FROM amazon/aws-lambda-ruby:2.7 AS bundler
WORKDIR /var/task
RUN yum groupinstall -y "Development Tools"
COPY ./Gemfile ./Gemfile
COPY ./Gemfile.lock ./Gemfile.lock
RUN bundle install --path=vendor/bundle

FROM amazon/aws-lambda-ruby:2.7
WORKDIR /var/task

ENV TZ=Asia/Tokyo

COPY --from=bundler /var/task/vendor ./vendor
COPY ./ ./

RUN ln -s /var/task/libexec/ffmpeg /usr/local/bin/ffmpeg \
  && ln -s /var/task/libexec/radigo /usr/local/bin/radigo

CMD ["function.Handler.handle"]
