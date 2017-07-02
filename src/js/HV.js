/**
 * Copyright [2017] [Indra Basak]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

/**
 * HystrixViewer is used for viewing Hystrix DropWizard metrics. It's a port of Hystrix Dashboard.
 * Here is an example, on how to use the library.
 * <p/>
 * <pre>
 *   //create a Hystrix dashboard
 *   hystrixViewer.addHystrixDashboard('#hystrix-div');
 *
 *   //refreshing the Hetric viewer with new metric data
 *   hystrixViewer.refresh(data);
 * </pre>
 *
 * @author Indra Basak
 * @since June 2017
 */
window.HV = {version: '1.0.0'};