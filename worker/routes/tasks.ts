import { Hono } from 'hono';
import { firebaseAuth } from '../middleware/firebaseAuth';
import { userContext } from '../middleware/userContext';
import type { Bindings, Variables } from '../types';
import tasksShare from './tasks-share';
import tasksBase from './tasks-base';
import tasksRecurrence from './tasks-recurrence';
import tasksHistory from './tasks-history';
import tasksExtra from './tasks-extra';

const tasks = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply authentication and user context to all routes
tasks.use('*', firebaseAuth());
tasks.use('*', userContext());

// Mount task sub-routes
// Share routes are mounted first so that static paths like "/shared-list" are not shadowed by parameter routes like "/:id"
tasks.route('/', tasksShare);
tasks.route('/', tasksBase);
tasks.route('/', tasksRecurrence);
tasks.route('/', tasksHistory);
tasks.route('/', tasksExtra);

export default tasks;

