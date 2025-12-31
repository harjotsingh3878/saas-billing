import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';

export class EventStack extends cdk.Stack {
  public readonly eventBus: events.EventBus;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.eventBus = new events.EventBus(this, 'SaaSBillingEventBus', {
      eventBusName: 'saas-billing-events',
    });

    // Archive all events for 30 days
    new events.Archive(this, 'EventArchive', {
      sourceEventBus: this.eventBus,
      eventPattern: {
        account: [cdk.Stack.of(this).account],
      },
      retention: cdk.Duration.days(30),
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: this.eventBus.eventBusName,
      exportName: 'EventBusName',
    });

    new cdk.CfnOutput(this, 'EventBusArn', {
      value: this.eventBus.eventBusArn,
      exportName: 'EventBusArn',
    });
  }
}
